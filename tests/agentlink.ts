import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Agentlink } from "../target/types/agentlink";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";
import * as crypto from "crypto";

describe("agentlink", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Agentlink as Program<Agentlink>;

  // Test wallets
  const creator1 = Keypair.generate();
  const creator2 = Keypair.generate();

  // Agent names
  const agent1Name = "matrix";
  const agent2Name = "oracle";

  // Job ID
  const jobId = "test-job-001";

  // Helper to get agent PDA
  const getAgentPDA = (creator: PublicKey, name: string) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), creator.toBuffer(), Buffer.from(name)],
      program.programId
    );
  };

  // Helper to get escrow PDA
  const getEscrowPDA = (jobId: string) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(jobId)],
      program.programId
    );
  };

  // Helper to create job hash
  const createJobHash = (title: string, description: string): number[] => {
    const hash = crypto.createHash("sha256");
    hash.update(title + description);
    return Array.from(hash.digest());
  };

  before(async () => {
    // Airdrop SOL to test wallets
    const airdropAmount = 10 * LAMPORTS_PER_SOL;

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(creator1.publicKey, airdropAmount)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(creator2.publicKey, airdropAmount)
    );

    console.log("Airdropped SOL to test wallets");
  });

  describe("Agent Registration", () => {
    it("registers an agent successfully", async () => {
      const [agentPDA] = getAgentPDA(creator1.publicKey, agent1Name);

      await program.methods
        .registerAgent(agent1Name)
        .accounts({
          agent: agentPDA,
          creator: creator1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator1])
        .rpc();

      // Fetch and verify agent account
      const agent = await program.account.agentAccount.fetch(agentPDA);

      expect(agent.name).to.equal(agent1Name);
      expect(agent.creator.toString()).to.equal(creator1.publicKey.toString());
      expect(agent.authority.toString()).to.equal(creator1.publicKey.toString());
      expect(agent.creatorSigned).to.be.true;
      expect(agent.verified).to.be.false;
      expect(agent.successfulJobs).to.equal(0);
      expect(agent.totalEarned.toNumber()).to.equal(0);
      expect(agent.totalSpent.toNumber()).to.equal(0);
      expect(agent.reputationScore).to.equal(0);
      expect(agent.creatorSplitBps).to.equal(1000); // 10% default

      console.log(`Agent '${agent1Name}' registered successfully`);
    });

    it("registers a second agent", async () => {
      const [agentPDA] = getAgentPDA(creator2.publicKey, agent2Name);

      await program.methods
        .registerAgent(agent2Name)
        .accounts({
          agent: agentPDA,
          creator: creator2.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator2])
        .rpc();

      const agent = await program.account.agentAccount.fetch(agentPDA);
      expect(agent.name).to.equal(agent2Name);

      console.log(`Agent '${agent2Name}' registered successfully`);
    });

    it("fails to register agent with empty name", async () => {
      const [agentPDA] = getAgentPDA(creator1.publicKey, "");

      try {
        await program.methods
          .registerAgent("")
          .accounts({
            agent: agentPDA,
            creator: creator1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([creator1])
          .rpc();

        expect.fail("Should have thrown error");
      } catch (err: any) {
        expect(err.message).to.include("NameEmpty");
      }
    });
  });

  describe("Job Creation", () => {
    it("creates a job with escrow", async () => {
      const [requesterAgentPDA] = getAgentPDA(creator1.publicKey, agent1Name);
      const [escrowPDA] = getEscrowPDA(jobId);

      const amount = 0.1 * LAMPORTS_PER_SOL;
      const jobHash = createJobHash("Test Job", "This is a test job description");

      const creator1BalanceBefore = await provider.connection.getBalance(creator1.publicKey);

      await program.methods
        .createJob(jobId, jobHash, new anchor.BN(amount), 24)
        .accounts({
          escrow: escrowPDA,
          requesterAgent: requesterAgentPDA,
          requester: creator1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator1])
        .rpc();

      // Verify escrow created
      const escrow = await program.account.escrowAccount.fetch(escrowPDA);

      expect(escrow.jobId).to.equal(jobId);
      expect(escrow.requester.toString()).to.equal(requesterAgentPDA.toString());
      expect(escrow.worker.toString()).to.equal(PublicKey.default.toString());
      expect(escrow.amount.toNumber()).to.equal(amount);
      expect(escrow.status).to.equal(0); // STATUS_OPEN
      expect(escrow.timeoutHours).to.equal(24);

      // Verify requester's total_spent updated
      const requesterAgent = await program.account.agentAccount.fetch(requesterAgentPDA);
      expect(requesterAgent.totalSpent.toNumber()).to.equal(amount);

      console.log(`Job '${jobId}' created with ${amount / LAMPORTS_PER_SOL} SOL escrow`);
    });

    it("fails to create job with invalid timeout", async () => {
      const [requesterAgentPDA] = getAgentPDA(creator1.publicKey, agent1Name);
      const [escrowPDA] = getEscrowPDA("invalid-timeout-job");

      const jobHash = createJobHash("Test", "Test");

      try {
        await program.methods
          .createJob("invalid-timeout-job", jobHash, new anchor.BN(LAMPORTS_PER_SOL), 12) // 12 hours not allowed
          .accounts({
            escrow: escrowPDA,
            requesterAgent: requesterAgentPDA,
            requester: creator1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([creator1])
          .rpc();

        expect.fail("Should have thrown error");
      } catch (err: any) {
        expect(err.message).to.include("InvalidTimeout");
      }
    });
  });

  describe("Hiring Flow", () => {
    it("hires an agent for the job", async () => {
      const [requesterAgentPDA] = getAgentPDA(creator1.publicKey, agent1Name);
      const [workerAgentPDA] = getAgentPDA(creator2.publicKey, agent2Name);
      const [escrowPDA] = getEscrowPDA(jobId);

      await program.methods
        .hireAgent()
        .accounts({
          escrow: escrowPDA,
          workerAgent: workerAgentPDA,
          requesterAgent: requesterAgentPDA,
          requester: creator1.publicKey,
        })
        .signers([creator1])
        .rpc();

      const escrow = await program.account.escrowAccount.fetch(escrowPDA);

      expect(escrow.worker.toString()).to.equal(workerAgentPDA.toString());
      expect(escrow.status).to.equal(1); // STATUS_IN_PROGRESS
      expect(escrow.deadline.toNumber()).to.be.greaterThan(0);

      console.log(`Agent '${agent2Name}' hired for job '${jobId}'`);
    });
  });

  describe("Job Completion", () => {
    it("worker marks job as complete", async () => {
      const [workerAgentPDA] = getAgentPDA(creator2.publicKey, agent2Name);
      const [escrowPDA] = getEscrowPDA(jobId);

      await program.methods
        .completeJob()
        .accounts({
          escrow: escrowPDA,
          workerAgent: workerAgentPDA,
          worker: creator2.publicKey,
        })
        .signers([creator2])
        .rpc();

      const escrow = await program.account.escrowAccount.fetch(escrowPDA);
      expect(escrow.status).to.equal(2); // STATUS_PENDING_APPROVAL

      console.log(`Job '${jobId}' marked as complete`);
    });
  });

  describe("Job Approval", () => {
    it("requester approves job and releases payment", async () => {
      const [requesterAgentPDA] = getAgentPDA(creator1.publicKey, agent1Name);
      const [workerAgentPDA] = getAgentPDA(creator2.publicKey, agent2Name);
      const [escrowPDA] = getEscrowPDA(jobId);

      const workerAgentBefore = await program.account.agentAccount.fetch(workerAgentPDA);
      const creator2BalanceBefore = await provider.connection.getBalance(creator2.publicKey);

      await program.methods
        .approveJob()
        .accounts({
          escrow: escrowPDA,
          workerAgent: workerAgentPDA,
          workerCreator: creator2.publicKey, // Worker's creator receives split
          requesterAgent: requesterAgentPDA,
          requester: creator1.publicKey,
        })
        .signers([creator1])
        .rpc();

      // Verify escrow status
      const escrow = await program.account.escrowAccount.fetch(escrowPDA);
      expect(escrow.status).to.equal(3); // STATUS_COMPLETED

      // Verify worker stats updated
      const workerAgent = await program.account.agentAccount.fetch(workerAgentPDA);
      expect(workerAgent.successfulJobs).to.equal(1);
      expect(workerAgent.totalEarned.toNumber()).to.be.greaterThan(0);
      expect(workerAgent.reputationScore).to.be.greaterThan(0);

      console.log(`Job '${jobId}' approved! Worker stats updated.`);
      console.log(`  - Successful jobs: ${workerAgent.successfulJobs}`);
      console.log(`  - Total earned: ${workerAgent.totalEarned.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`  - Reputation score: ${workerAgent.reputationScore}`);
    });
  });

  describe("Job Cancellation", () => {
    const cancelJobId = "cancel-test-job";

    it("creates a job to cancel", async () => {
      const [requesterAgentPDA] = getAgentPDA(creator1.publicKey, agent1Name);
      const [escrowPDA] = getEscrowPDA(cancelJobId);

      const amount = 0.05 * LAMPORTS_PER_SOL;
      const jobHash = createJobHash("Cancel Test", "This job will be cancelled");

      await program.methods
        .createJob(cancelJobId, jobHash, new anchor.BN(amount), 48)
        .accounts({
          escrow: escrowPDA,
          requesterAgent: requesterAgentPDA,
          requester: creator1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator1])
        .rpc();

      console.log(`Created job '${cancelJobId}' for cancellation test`);
    });

    it("cancels job and refunds escrow", async () => {
      const [requesterAgentPDA] = getAgentPDA(creator1.publicKey, agent1Name);
      const [escrowPDA] = getEscrowPDA(cancelJobId);

      const creator1BalanceBefore = await provider.connection.getBalance(creator1.publicKey);
      const requesterAgentBefore = await program.account.agentAccount.fetch(requesterAgentPDA);

      await program.methods
        .cancelJob()
        .accounts({
          escrow: escrowPDA,
          requesterAgent: requesterAgentPDA,
          requester: creator1.publicKey,
        })
        .signers([creator1])
        .rpc();

      // Verify escrow cancelled
      const escrow = await program.account.escrowAccount.fetch(escrowPDA);
      expect(escrow.status).to.equal(5); // STATUS_CANCELLED
      expect(escrow.amount.toNumber()).to.equal(0);

      // Verify total_spent reduced
      const requesterAgent = await program.account.agentAccount.fetch(requesterAgentPDA);
      expect(requesterAgent.totalSpent.toNumber()).to.be.lessThan(requesterAgentBefore.totalSpent.toNumber());

      console.log(`Job '${cancelJobId}' cancelled and refunded`);
    });
  });

  describe("Configure Split", () => {
    it("updates creator split percentage", async () => {
      const [agentPDA] = getAgentPDA(creator1.publicKey, agent1Name);

      await program.methods
        .configureSplit(2000) // 20%
        .accounts({
          agent: agentPDA,
          authority: creator1.publicKey,
        })
        .signers([creator1])
        .rpc();

      const agent = await program.account.agentAccount.fetch(agentPDA);
      expect(agent.creatorSplitBps).to.equal(2000);

      console.log(`Agent '${agent1Name}' split updated to 20%`);
    });

    it("fails to set split above max", async () => {
      const [agentPDA] = getAgentPDA(creator1.publicKey, agent1Name);

      try {
        await program.methods
          .configureSplit(6000) // 60% - above max of 50%
          .accounts({
            agent: agentPDA,
            authority: creator1.publicKey,
          })
          .signers([creator1])
          .rpc();

        expect.fail("Should have thrown error");
      } catch (err: any) {
        expect(err.message).to.include("SplitTooHigh");
      }
    });
  });

  describe("Dispute Flow", () => {
    const disputeJobId = "dispute-test-job";

    it("creates and hires for dispute test", async () => {
      const [requesterAgentPDA] = getAgentPDA(creator1.publicKey, agent1Name);
      const [workerAgentPDA] = getAgentPDA(creator2.publicKey, agent2Name);
      const [escrowPDA] = getEscrowPDA(disputeJobId);

      const jobHash = createJobHash("Dispute Test", "This job will be disputed");

      // Create job
      await program.methods
        .createJob(disputeJobId, jobHash, new anchor.BN(0.1 * LAMPORTS_PER_SOL), 24)
        .accounts({
          escrow: escrowPDA,
          requesterAgent: requesterAgentPDA,
          requester: creator1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator1])
        .rpc();

      // Hire agent
      await program.methods
        .hireAgent()
        .accounts({
          escrow: escrowPDA,
          workerAgent: workerAgentPDA,
          requesterAgent: requesterAgentPDA,
          requester: creator1.publicKey,
        })
        .signers([creator1])
        .rpc();

      console.log(`Created and hired for dispute test job`);
    });

    it("worker can dispute a job", async () => {
      const [workerAgentPDA] = getAgentPDA(creator2.publicKey, agent2Name);
      const [escrowPDA] = getEscrowPDA(disputeJobId);

      await program.methods
        .disputeJob()
        .accounts({
          escrow: escrowPDA,
          callerAgent: workerAgentPDA,
          caller: creator2.publicKey,
        })
        .signers([creator2])
        .rpc();

      const escrow = await program.account.escrowAccount.fetch(escrowPDA);
      expect(escrow.status).to.equal(4); // STATUS_DISPUTED

      console.log(`Job '${disputeJobId}' disputed by worker`);
    });
  });

  describe("Summary", () => {
    it("prints final agent states", async () => {
      const [agent1PDA] = getAgentPDA(creator1.publicKey, agent1Name);
      const [agent2PDA] = getAgentPDA(creator2.publicKey, agent2Name);

      const agent1 = await program.account.agentAccount.fetch(agent1PDA);
      const agent2 = await program.account.agentAccount.fetch(agent2PDA);

      console.log("\n=== Final Agent States ===");
      console.log(`\nAgent '${agent1Name}':`);
      console.log(`  - Verified: ${agent1.verified}`);
      console.log(`  - Successful jobs: ${agent1.successfulJobs}`);
      console.log(`  - Total earned: ${agent1.totalEarned.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`  - Total spent: ${agent1.totalSpent.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`  - Reputation: ${agent1.reputationScore}`);
      console.log(`  - Split: ${agent1.creatorSplitBps / 100}%`);

      console.log(`\nAgent '${agent2Name}':`);
      console.log(`  - Verified: ${agent2.verified}`);
      console.log(`  - Successful jobs: ${agent2.successfulJobs}`);
      console.log(`  - Total earned: ${agent2.totalEarned.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`  - Total spent: ${agent2.totalSpent.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`  - Reputation: ${agent2.reputationScore}`);
      console.log(`  - Split: ${agent2.creatorSplitBps / 100}%`);
    });
  });
});
