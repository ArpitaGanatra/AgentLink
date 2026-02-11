---
name: solana-dev
description: Solana development best practices - SDK, smart contracts, testing, deployment
allowed-tools: Bash, Read, Write, Grep, Glob
---

# Solana Development Guide

## Recommended Stack

### Client SDK (Use This)
```bash
npm install @solana/kit @solana/react-hooks
```

**Do NOT use legacy `@solana/web3.js`** - contain it to adapter modules only via `@solana/web3-compat`.

### Types to Use
- `Address` from @solana/kit
- `Signer` from @solana/kit
- Transaction message APIs from @solana/kit
- Codecs from @solana/kit

### Instruction Builders
Use `@solana-program/*` packages instead of manual instruction data.

## Smart Contract Development

### Anchor (Default Choice)
Fast iteration, IDL generation, mature tooling.

```bash
# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli

# Create project
anchor init my_project
cd my_project

# Build
anchor build

# Test
anchor test

# Deploy
anchor deploy
```

### Pinocchio (Performance Focus)
Use when needing:
- Compute unit optimization
- Minimal binary size
- Zero dependencies
- Fine-grained control over parsing/allocations

## Testing Strategy

| Test Type | Tool | Use For |
|-----------|------|---------|
| Unit | LiteSVM, Mollusk | Fast in-process feedback |
| Integration | Surfpool | Realistic cluster state |
| RPC-specific | solana-test-validator | Only when necessary |

## Implementation Checklist

Always explicitly handle:
- [ ] Cluster selection (devnet/mainnet)
- [ ] RPC and WebSocket endpoints
- [ ] Fee payer account
- [ ] Recent blockhash fetching
- [ ] Compute budget and priority fees
- [ ] Account ownership verification
- [ ] Signer requirements
- [ ] Writability flags
- [ ] Token program variant (SPL Token vs Token-2022)

## Common Patterns

### Connect to Cluster
```typescript
import { createSolanaRpc } from '@solana/kit';

const rpc = createSolanaRpc('https://api.devnet.solana.com');
```

### Get Balance
```typescript
const balance = await rpc.getBalance(address).send();
```

### Send Transaction
```typescript
import {
  createTransactionMessage,
  setTransactionMessageFeePayer,
  appendTransactionMessageInstruction,
  signTransaction,
  sendAndConfirmTransaction
} from '@solana/kit';

const message = createTransactionMessage({ version: 0 });
// ... build transaction
const signedTx = await signTransaction([signer], message);
await sendAndConfirmTransaction(rpc, signedTx);
```

## Useful Resources

- Solana Cookbook: https://solanacookbook.com
- Anchor Book: https://book.anchor-lang.com
- Solana Playground: https://beta.solpg.io

## For Hackathon

1. Use AgentWallet for wallet management (not solana-keygen)
2. Test on devnet first
3. Use Anchor for faster development
4. Keep compute units low for cheaper transactions
5. Document your Solana integration clearly for judges
