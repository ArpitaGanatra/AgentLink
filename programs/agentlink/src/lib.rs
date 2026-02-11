use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("3guFi1GbjiSKxVvsG5mQhP34vHYWBhUX98TibcoRHKZD");

// Constants
pub const MAX_NAME_LENGTH: usize = 32;
pub const MAX_JOB_ID_LENGTH: usize = 36; // UUID length
pub const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
pub const MAX_SPLIT_BPS: u16 = 5000; // 50% max to creator
pub const DEFAULT_SPLIT_BPS: u16 = 1000; // 10% default to creator
pub const VERIFICATION_THRESHOLD: u32 = 3; // Jobs needed for verification

// Job status enum values
pub const STATUS_OPEN: u8 = 0;
pub const STATUS_IN_PROGRESS: u8 = 1;
pub const STATUS_PENDING_APPROVAL: u8 = 2;
pub const STATUS_COMPLETED: u8 = 3;
pub const STATUS_DISPUTED: u8 = 4;
pub const STATUS_CANCELLED: u8 = 5;

#[program]
pub mod agentlink {
    use super::*;

    /// Register a new agent with on-chain identity
    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        name: String,
    ) -> Result<()> {
        require!(name.len() <= MAX_NAME_LENGTH, AgentLinkError::NameTooLong);
        require!(!name.is_empty(), AgentLinkError::NameEmpty);

        let agent = &mut ctx.accounts.agent;
        let clock = Clock::get()?;

        agent.bump = ctx.bumps.agent;
        agent.name = name;
        agent.creator = ctx.accounts.creator.key();
        agent.authority = ctx.accounts.creator.key();
        agent.created_at = clock.unix_timestamp;
        agent.creator_signed = true;
        agent.verified = false;
        agent.successful_jobs = 0;
        agent.total_earned = 0;
        agent.total_spent = 0;
        agent.reputation_score = 0;
        agent.creator_split_bps = DEFAULT_SPLIT_BPS;

        msg!("Agent '{}' registered by {}", agent.name, agent.creator);

        Ok(())
    }

    /// Create a new job with escrow
    pub fn create_job(
        ctx: Context<CreateJob>,
        job_id: String,
        job_hash: [u8; 32],
        amount: u64,
        timeout_hours: u8,
    ) -> Result<()> {
        require!(job_id.len() <= MAX_JOB_ID_LENGTH, AgentLinkError::JobIdTooLong);
        require!(amount > 0, AgentLinkError::InvalidAmount);
        require!(
            timeout_hours == 24 || timeout_hours == 48 || timeout_hours == 72,
            AgentLinkError::InvalidTimeout
        );

        let clock = Clock::get()?;

        // Transfer SOL from requester to escrow PDA first
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.requester.to_account_info(),
                    to: ctx.accounts.escrow.to_account_info(),
                },
            ),
            amount,
        )?;

        // Now set escrow fields
        let escrow = &mut ctx.accounts.escrow;
        escrow.bump = ctx.bumps.escrow;
        escrow.job_id = job_id.clone();
        escrow.job_hash = job_hash;
        escrow.requester = ctx.accounts.requester_agent.key();
        escrow.worker = Pubkey::default();
        escrow.amount = amount;
        escrow.status = STATUS_OPEN;
        escrow.timeout_hours = timeout_hours;
        escrow.deadline = 0; // Set when hired
        escrow.created_at = clock.unix_timestamp;

        // Update requester's total_spent
        let requester_agent = &mut ctx.accounts.requester_agent;
        requester_agent.total_spent = requester_agent.total_spent.checked_add(amount).unwrap();

        msg!("Job '{}' created with {} lamports escrow", job_id, amount);

        Ok(())
    }

    /// Hire an agent for a job
    pub fn hire_agent(ctx: Context<HireAgent>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        require!(escrow.status == STATUS_OPEN, AgentLinkError::InvalidJobStatus);

        escrow.worker = ctx.accounts.worker_agent.key();
        escrow.status = STATUS_IN_PROGRESS;
        escrow.deadline = clock.unix_timestamp + (escrow.timeout_hours as i64 * 3600);

        msg!(
            "Agent hired for job '{}'. Deadline: {}",
            escrow.job_id,
            escrow.deadline
        );

        Ok(())
    }

    /// Mark job as complete (worker)
    pub fn complete_job(ctx: Context<CompleteJob>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        require!(
            escrow.status == STATUS_IN_PROGRESS,
            AgentLinkError::InvalidJobStatus
        );
        require!(
            escrow.worker == ctx.accounts.worker_agent.key(),
            AgentLinkError::Unauthorized
        );

        escrow.status = STATUS_PENDING_APPROVAL;

        msg!("Job '{}' marked as complete, pending approval", escrow.job_id);

        Ok(())
    }

    /// Approve job and release payment (requester)
    pub fn approve_job(ctx: Context<ApproveJob>) -> Result<()> {
        require!(
            ctx.accounts.escrow.status == STATUS_PENDING_APPROVAL,
            AgentLinkError::InvalidJobStatus
        );

        // Extract values we need before any mutable borrows
        let escrow_amount = ctx.accounts.escrow.amount;
        let split_bps = ctx.accounts.worker_agent.creator_split_bps;

        // Calculate split
        let creator_amount = (escrow_amount as u128)
            .checked_mul(split_bps as u128)
            .unwrap()
            .checked_div(10000)
            .unwrap() as u64;
        let worker_amount = escrow_amount.checked_sub(creator_amount).unwrap();

        // Do lamport transfers first
        if creator_amount > 0 {
            **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= creator_amount;
            **ctx.accounts.worker_creator.to_account_info().try_borrow_mut_lamports()? += creator_amount;
        }

        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= worker_amount;
        **ctx.accounts.worker_agent.to_account_info().try_borrow_mut_lamports()? += worker_amount;

        // Now update account data
        let worker_agent = &mut ctx.accounts.worker_agent;
        worker_agent.successful_jobs = worker_agent.successful_jobs.checked_add(1).unwrap();
        worker_agent.total_earned = worker_agent.total_earned.checked_add(escrow_amount).unwrap();

        // Check for auto-verification
        if worker_agent.successful_jobs >= VERIFICATION_THRESHOLD && !worker_agent.verified {
            worker_agent.verified = true;
            msg!("Agent '{}' is now verified!", worker_agent.name);
        }

        // Update reputation score
        worker_agent.reputation_score = calculate_reputation(
            worker_agent.successful_jobs,
            worker_agent.total_earned,
        );

        let escrow = &mut ctx.accounts.escrow;
        escrow.status = STATUS_COMPLETED;

        msg!(
            "Job '{}' approved. Worker received {} lamports, creator received {} lamports",
            escrow.job_id,
            worker_amount,
            creator_amount
        );

        Ok(())
    }

    /// Claim payment after timeout (anyone can call)
    pub fn claim_timeout(ctx: Context<ClaimTimeout>) -> Result<()> {
        let clock = Clock::get()?;

        require!(
            ctx.accounts.escrow.status == STATUS_PENDING_APPROVAL,
            AgentLinkError::InvalidJobStatus
        );
        require!(
            clock.unix_timestamp > ctx.accounts.escrow.deadline,
            AgentLinkError::DeadlineNotReached
        );

        // Extract values we need
        let escrow_amount = ctx.accounts.escrow.amount;
        let split_bps = ctx.accounts.worker_agent.creator_split_bps;

        // Calculate split
        let creator_amount = (escrow_amount as u128)
            .checked_mul(split_bps as u128)
            .unwrap()
            .checked_div(10000)
            .unwrap() as u64;
        let worker_amount = escrow_amount.checked_sub(creator_amount).unwrap();

        // Do lamport transfers first
        if creator_amount > 0 {
            **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= creator_amount;
            **ctx.accounts.worker_creator.to_account_info().try_borrow_mut_lamports()? += creator_amount;
        }

        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= worker_amount;
        **ctx.accounts.worker_agent.to_account_info().try_borrow_mut_lamports()? += worker_amount;

        // Now update account data
        let worker_agent = &mut ctx.accounts.worker_agent;
        worker_agent.successful_jobs = worker_agent.successful_jobs.checked_add(1).unwrap();
        worker_agent.total_earned = worker_agent.total_earned.checked_add(escrow_amount).unwrap();

        // Check for auto-verification
        if worker_agent.successful_jobs >= VERIFICATION_THRESHOLD && !worker_agent.verified {
            worker_agent.verified = true;
            msg!("Agent '{}' is now verified!", worker_agent.name);
        }

        // Update reputation score
        worker_agent.reputation_score = calculate_reputation(
            worker_agent.successful_jobs,
            worker_agent.total_earned,
        );

        let escrow = &mut ctx.accounts.escrow;
        let job_id = escrow.job_id.clone();
        escrow.status = STATUS_COMPLETED;

        msg!(
            "Job '{}' auto-released after timeout. Worker received {} lamports",
            job_id,
            worker_amount
        );

        Ok(())
    }

    /// Cancel job and refund (requester, only if status is Open)
    pub fn cancel_job(ctx: Context<CancelJob>) -> Result<()> {
        require!(ctx.accounts.escrow.status == STATUS_OPEN, AgentLinkError::InvalidJobStatus);

        // Get refund amount
        let refund_amount = ctx.accounts.escrow.amount;

        // Do lamport transfer first
        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
        **ctx.accounts.requester.to_account_info().try_borrow_mut_lamports()? += refund_amount;

        // Now update account data
        let requester_agent = &mut ctx.accounts.requester_agent;
        requester_agent.total_spent = requester_agent.total_spent.checked_sub(refund_amount).unwrap();

        let escrow = &mut ctx.accounts.escrow;
        let job_id = escrow.job_id.clone();
        escrow.status = STATUS_CANCELLED;
        escrow.amount = 0;

        msg!("Job '{}' cancelled, {} lamports refunded", job_id, refund_amount);

        Ok(())
    }

    /// Dispute a job (either party)
    pub fn dispute_job(ctx: Context<DisputeJob>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        require!(
            escrow.status == STATUS_IN_PROGRESS || escrow.status == STATUS_PENDING_APPROVAL,
            AgentLinkError::InvalidJobStatus
        );

        // Verify caller is either requester or worker
        let caller = ctx.accounts.caller.key();
        let caller_agent = ctx.accounts.caller_agent.key();
        require!(
            caller_agent == escrow.requester || caller_agent == escrow.worker,
            AgentLinkError::Unauthorized
        );

        escrow.status = STATUS_DISPUTED;

        msg!("Job '{}' disputed by {}", escrow.job_id, caller);

        Ok(())
    }

    /// Configure creator split percentage
    pub fn configure_split(ctx: Context<ConfigureSplit>, new_split_bps: u16) -> Result<()> {
        require!(new_split_bps <= MAX_SPLIT_BPS, AgentLinkError::SplitTooHigh);

        let agent = &mut ctx.accounts.agent;
        agent.creator_split_bps = new_split_bps;

        msg!("Agent '{}' split updated to {}bps", agent.name, new_split_bps);

        Ok(())
    }

    /// Withdraw earnings from agent PDA
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        // Get agent PDA balance (excluding rent)
        let rent = Rent::get()?;
        let min_balance = rent.minimum_balance(AgentAccount::SPACE);
        let agent_balance = ctx.accounts.agent.to_account_info().lamports();
        let available = agent_balance.checked_sub(min_balance).unwrap_or(0);

        let withdraw_amount = if amount == 0 { available } else { amount };
        require!(withdraw_amount <= available, AgentLinkError::InsufficientFunds);
        require!(withdraw_amount > 0, AgentLinkError::NothingToWithdraw);

        // Transfer from agent PDA to authority
        **ctx.accounts.agent.to_account_info().try_borrow_mut_lamports()? -= withdraw_amount;
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += withdraw_amount;

        msg!(
            "Withdrew {} lamports from agent '{}' to {}",
            withdraw_amount,
            ctx.accounts.agent.name,
            ctx.accounts.authority.key()
        );

        Ok(())
    }
}

// Helper function to calculate reputation score
fn calculate_reputation(successful_jobs: u32, total_earned: u64) -> u16 {
    let job_points = (successful_jobs as u64).saturating_mul(500);
    let earned_points = (total_earned / LAMPORTS_PER_SOL).saturating_mul(10);
    let total = job_points.saturating_add(earned_points);
    std::cmp::min(total, 10000) as u16
}

// ============== ACCOUNTS ==============

#[account]
pub struct AgentAccount {
    pub bump: u8,                    // 1
    pub name: String,                // 4 + MAX_NAME_LENGTH
    pub creator: Pubkey,             // 32
    pub authority: Pubkey,           // 32
    pub created_at: i64,             // 8
    pub creator_signed: bool,        // 1
    pub verified: bool,              // 1
    pub successful_jobs: u32,        // 4
    pub total_earned: u64,           // 8
    pub total_spent: u64,            // 8
    pub reputation_score: u16,       // 2
    pub creator_split_bps: u16,      // 2
}

impl AgentAccount {
    pub const SPACE: usize = 8 // discriminator
        + 1  // bump
        + 4 + MAX_NAME_LENGTH  // name
        + 32 // creator
        + 32 // authority
        + 8  // created_at
        + 1  // creator_signed
        + 1  // verified
        + 4  // successful_jobs
        + 8  // total_earned
        + 8  // total_spent
        + 2  // reputation_score
        + 2; // creator_split_bps
}

#[account]
pub struct EscrowAccount {
    pub bump: u8,                    // 1
    pub job_id: String,              // 4 + MAX_JOB_ID_LENGTH
    pub job_hash: [u8; 32],          // 32
    pub requester: Pubkey,           // 32
    pub worker: Pubkey,              // 32
    pub amount: u64,                 // 8
    pub status: u8,                  // 1
    pub timeout_hours: u8,           // 1
    pub deadline: i64,               // 8
    pub created_at: i64,             // 8
}

impl EscrowAccount {
    pub const SPACE: usize = 8 // discriminator
        + 1  // bump
        + 4 + MAX_JOB_ID_LENGTH  // job_id
        + 32 // job_hash
        + 32 // requester
        + 32 // worker
        + 8  // amount
        + 1  // status
        + 1  // timeout_hours
        + 8  // deadline
        + 8; // created_at
}

// ============== CONTEXTS ==============

#[derive(Accounts)]
#[instruction(name: String)]
pub struct RegisterAgent<'info> {
    #[account(
        init,
        payer = creator,
        space = AgentAccount::SPACE,
        seeds = [b"agent", creator.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub agent: Account<'info, AgentAccount>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(job_id: String)]
pub struct CreateJob<'info> {
    #[account(
        init,
        payer = requester,
        space = EscrowAccount::SPACE,
        seeds = [b"escrow", job_id.as_bytes()],
        bump
    )]
    pub escrow: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub requester_agent: Account<'info, AgentAccount>,

    #[account(
        mut,
        constraint = requester.key() == requester_agent.authority @ AgentLinkError::Unauthorized
    )]
    pub requester: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct HireAgent<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,

    pub worker_agent: Account<'info, AgentAccount>,

    #[account(
        constraint = requester.key() == requester_agent.authority @ AgentLinkError::Unauthorized
    )]
    pub requester_agent: Account<'info, AgentAccount>,

    pub requester: Signer<'info>,
}

#[derive(Accounts)]
pub struct CompleteJob<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,

    pub worker_agent: Account<'info, AgentAccount>,

    #[account(
        constraint = worker.key() == worker_agent.authority @ AgentLinkError::Unauthorized
    )]
    pub worker: Signer<'info>,
}

#[derive(Accounts)]
pub struct ApproveJob<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,

    #[account(
        mut,
        constraint = escrow.worker == worker_agent.key() @ AgentLinkError::InvalidWorker
    )]
    pub worker_agent: Account<'info, AgentAccount>,

    /// CHECK: Worker's creator wallet to receive split
    #[account(
        mut,
        constraint = worker_creator.key() == worker_agent.creator @ AgentLinkError::InvalidCreator
    )]
    pub worker_creator: AccountInfo<'info>,

    #[account(
        constraint = escrow.requester == requester_agent.key() @ AgentLinkError::InvalidRequester
    )]
    pub requester_agent: Account<'info, AgentAccount>,

    #[account(
        constraint = requester.key() == requester_agent.authority @ AgentLinkError::Unauthorized
    )]
    pub requester: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimTimeout<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,

    #[account(
        mut,
        constraint = escrow.worker == worker_agent.key() @ AgentLinkError::InvalidWorker
    )]
    pub worker_agent: Account<'info, AgentAccount>,

    /// CHECK: Worker's creator wallet to receive split
    #[account(
        mut,
        constraint = worker_creator.key() == worker_agent.creator @ AgentLinkError::InvalidCreator
    )]
    pub worker_creator: AccountInfo<'info>,

    /// Anyone can call this after timeout
    pub caller: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelJob<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,

    #[account(
        mut,
        constraint = escrow.requester == requester_agent.key() @ AgentLinkError::InvalidRequester
    )]
    pub requester_agent: Account<'info, AgentAccount>,

    #[account(
        mut,
        constraint = requester.key() == requester_agent.authority @ AgentLinkError::Unauthorized
    )]
    pub requester: Signer<'info>,
}

#[derive(Accounts)]
pub struct DisputeJob<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,

    /// Agent account of the caller (must be requester or worker)
    pub caller_agent: Account<'info, AgentAccount>,

    #[account(
        constraint = caller.key() == caller_agent.authority @ AgentLinkError::Unauthorized
    )]
    pub caller: Signer<'info>,
}

#[derive(Accounts)]
pub struct ConfigureSplit<'info> {
    #[account(
        mut,
        constraint = authority.key() == agent.authority @ AgentLinkError::Unauthorized
    )]
    pub agent: Account<'info, AgentAccount>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        constraint = authority.key() == agent.authority @ AgentLinkError::Unauthorized
    )]
    pub agent: Account<'info, AgentAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

// ============== ERRORS ==============

#[error_code]
pub enum AgentLinkError {
    #[msg("Agent name too long (max 32 characters)")]
    NameTooLong,
    #[msg("Agent name cannot be empty")]
    NameEmpty,
    #[msg("Job ID too long (max 36 characters)")]
    JobIdTooLong,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid timeout (must be 24, 48, or 72 hours)")]
    InvalidTimeout,
    #[msg("Invalid job status for this operation")]
    InvalidJobStatus,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid worker")]
    InvalidWorker,
    #[msg("Invalid requester")]
    InvalidRequester,
    #[msg("Invalid creator")]
    InvalidCreator,
    #[msg("Deadline not reached")]
    DeadlineNotReached,
    #[msg("Creator split too high (max 50%)")]
    SplitTooHigh,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Nothing to withdraw")]
    NothingToWithdraw,
}
