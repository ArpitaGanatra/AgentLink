---
name: solana-agent-kit
description: Solana Agent Kit - 60+ autonomous blockchain operations including token deployment, swaps, NFTs, DeFi, staking, and cross-chain bridging
allowed-tools: Bash, Read, Write
---

# Solana Agent Kit

Open-source toolkit for AI agents to perform 60+ Solana blockchain operations autonomously.

**Docs:** https://docs.sendai.fun
**Demo:** https://kit.sendai.fun
**GitHub:** https://github.com/sendaifun/solana-agent-kit

## Installation

```bash
npm install solana-agent-kit
```

### Optional Plugins
```bash
npm install @solana-agent-kit/plugin-token   # SPL tokens, swaps, bridging
npm install @solana-agent-kit/plugin-nft     # Metaplex NFTs, collections
npm install @solana-agent-kit/plugin-defi    # Staking, lending, perpetuals
npm install @solana-agent-kit/plugin-misc    # Airdrops, price feeds, domains
npm install @solana-agent-kit/plugin-blinks  # Arcade games, protocol interactions
```

## Quick Start

```typescript
import { SolanaAgentKit, createVercelAITools, KeypairWallet } from "solana-agent-kit";
import TokenPlugin from "@solana-agent-kit/plugin-token";
import NFTPlugin from "@solana-agent-kit/plugin-nft";
import DefiPlugin from "@solana-agent-kit/plugin-defi";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const keyPair = Keypair.fromSecretKey(bs58.decode(process.env.SOLANA_PRIVATE_KEY!));
const wallet = new KeypairWallet(keyPair);

const agent = new SolanaAgentKit(
  wallet,
  process.env.RPC_URL || "https://api.devnet.solana.com",
  { OPENAI_API_KEY: process.env.OPENAI_API_KEY }
)
  .use(TokenPlugin)
  .use(NFTPlugin)
  .use(DefiPlugin);

// Create tools for AI frameworks
const tools = createVercelAITools(agent, agent.actions);
```

## Available Actions

### Token Operations
```typescript
// Deploy new token
const result = await agent.methods.deployToken(
  agent,
  "My Token",           // name
  "https://meta.uri",   // metadata URI
  "MTK",                // symbol
  9,                    // decimals
  { mintAuthority: null },
  1000000               // initial supply
);

// Swap tokens via Jupiter
const signature = await agent.methods.trade(
  agent,
  new PublicKey("target-mint"),
  100,                  // amount
  new PublicKey("source-mint"),
  300                   // 3% slippage (basis points)
);

// Transfer tokens
await agent.methods.transfer(agent, destination, amount, mint);

// Check balance
const balance = await agent.methods.getBalance(agent, tokenMint);
```

### NFT Operations
```typescript
// Deploy collection
const collection = await agent.methods.deployCollection(agent, {
  name: "My NFT Collection",
  uri: "https://arweave.net/metadata.json",
  royaltyBasisPoints: 500,  // 5%
  creators: [{ address: "wallet", percentage: 100 }]
});

// Mint NFT
const nft = await agent.methods.mintNFT(agent, {
  name: "NFT Name",
  uri: "https://arweave.net/nft-metadata.json",
  collection: collectionMint
});
```

### DeFi Operations
```typescript
// Lend USDC
const signature = await agent.methods.lendAssets(agent, 100);

// Stake SOL with Jupiter
const signature = await agent.methods.stakeWithJup(agent, 1);

// Stake with Solayer
const signature = await agent.methods.stakeWithSolayer(agent, 1);
```

### Cross-Chain Bridging
```typescript
// Bridge via Wormhole
await agent.methods.bridgeWithWormhole(agent, {
  targetChain: "ethereum",
  amount: 100,
  token: "USDC"
});

// Bridge via deBridge
await agent.methods.bridgeWithDeBridge(agent, {
  targetChain: "base",
  amount: 50,
  token: "SOL"
});
```

### Market Data (CoinGecko)
```typescript
// Get token price
const price = await agent.methods.getTokenPrice(agent, "SOL");

// Get trending tokens
const trending = await agent.methods.getTrendingTokens(agent);

// Get top gainers
const gainers = await agent.methods.getTopGainers(agent);
```

## Protocol Integrations

| Protocol | Operations |
|----------|------------|
| Jupiter | Swaps, limit orders, DCA |
| Raydium | CPMM, CLMM, AMMv4 pools |
| Orca | Whirlpool operations |
| Meteora | Dynamic AMM, DLMM pools |
| Drift | Vaults, perpetuals, lending |
| Adrena | Perpetuals trading |
| Metaplex | NFTs, collections |
| 3.Land | NFT marketplace |
| Lulo | Lending optimization |

## AI Framework Integration

### LangChain
```typescript
import { createLangchainTools } from "solana-agent-kit";
const tools = createLangchainTools(agent, agent.actions);
```

### Vercel AI SDK
```typescript
import { createVercelAITools } from "solana-agent-kit";
const tools = createVercelAITools(agent, agent.actions);
```

### OpenAI
```typescript
import { createOpenAITools } from "solana-agent-kit";
const tools = createOpenAITools(agent, agent.actions);
```

## Environment Variables

```bash
SOLANA_PRIVATE_KEY=your_base58_private_key
RPC_URL=https://api.devnet.solana.com
OPENAI_API_KEY=your_openai_key  # optional
```

## Security

- Use dedicated wallet for agent operations
- Test on devnet before mainnet
- Never commit private keys
- Monitor agent activities
