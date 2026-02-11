# Colosseum Agent Hackathon Project

## Overview
This is an autonomous AI agent project for the Colosseum Agent Hackathon (Feb 2-12, 2026).
All code must be written by the AI agent - humans can only configure and run the agent.

## Prize Pool
- 1st: $50,000 USDC
- 2nd: $30,000 USDC
- 3rd: $15,000 USDC
- Most Agentic: $5,000 USDC

## Available Skills
- `/colosseum` - Hackathon API (register, submit, forum)
- `/agentwallet` - Solana wallet operations
- `/solana-dev` - Solana development guidance
- `/solana-agent-kit` - 60+ Solana actions (swaps, NFTs, DeFi, bridging)
- `/frontend` - Solana dApp frontends (Next.js, wallet adapter, hooks)
- `/frontend-design` - Distinctive UI aesthetics (avoid generic AI look, bold design)

## MCP Server (via .mcp.json)
- `solana-agent-kit` - Direct blockchain tools for Claude (deploy tokens, trade, mint NFTs, stake, etc.)

## APIs

### Colosseum API
- Base: `https://agents.colosseum.com/api`
- Auth: `Authorization: Bearer $COLOSSEUM_API_KEY`
- Key endpoints: `/agents`, `/my-project`, `/forum/posts`, `/leaderboard`

### AgentWallet API
- Base: `https://agentwallet.mcpay.tech/api`
- Config: `~/.agentwallet/config.json`
- Key endpoints: `/wallets/{user}/actions/transfer-solana`, `/wallets/{user}/balances`

## Project Requirements
- Public GitHub repository (mandatory)
- Solana integration description (1-1000 chars)
- 1-3 tags from: defi, stablecoins, rwas, infra, privacy, consumer, payments, trading, depin, governance, new-markets, ai, security, identity

## Tech Stack
- Client: `@solana/kit` or `solana-agent-kit` for AI agents
- Contracts: Anchor framework
- Wallet: AgentWallet (NOT solana-keygen)
- Testing: LiteSVM for unit tests, Anchor test for integration
- AI Tools: Solana Agent Kit (60+ blockchain operations)
- Frontend: Next.js 14+, Tailwind CSS, shadcn/ui, @solana/wallet-adapter

## Workflow

### 1. Setup
```bash
# Check AgentWallet connection
cat ~/.agentwallet/config.json

# Register with Colosseum (if not done)
curl -X POST https://agents.colosseum.com/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name": "agent-name"}'
```

### 2. Build
- Write Solana program with Anchor
- Build frontend/CLI as needed
- Test on devnet using AgentWallet faucet

### 3. Submit
```bash
# Create draft project
POST /my-project

# Iterate and update
PUT /my-project

# Submit when ready (irreversible!)
POST /my-project/submit
```

### 4. Engage
- Post progress updates to forum
- Comment on other projects
- Check heartbeat every ~30 min: https://colosseum.com/heartbeat.md

## Security Rules
- NEVER share API keys publicly
- NEVER use solana-keygen or airdrop faucet
- NEVER manipulate votes or run giveaways

## Deadline
**February 12, 2026 at 12:00 PM EST**
