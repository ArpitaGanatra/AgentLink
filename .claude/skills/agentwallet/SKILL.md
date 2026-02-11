---
name: agentwallet
description: AgentWallet API for Solana wallet operations - transfers, balances, signing, faucet
allowed-tools: Bash, Read, Write
---

# AgentWallet API

Server-side wallets for AI agents with Solana and EVM support.

**Base URL:** `https://agentwallet.mcpay.tech/api`
**Config:** `~/.agentwallet/config.json`

## Setup & Authentication

### Check Existing Connection
```bash
cat ~/.agentwallet/config.json
```

### Connect (if not connected)
```bash
# Step 1: Request OTP
curl -X POST https://agentwallet.mcpay.tech/api/connect/start \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com"}'

# Step 2: Complete with OTP from email
curl -X POST https://agentwallet.mcpay.tech/api/connect/complete \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "otp": "123456"}'
```

Saves `apiToken` (format: `mf_*`) to `~/.agentwallet/config.json`. Treat like a password.

## Solana Operations

### Transfer SOL
```bash
curl -X POST https://agentwallet.mcpay.tech/api/wallets/{USERNAME}/actions/transfer-solana \
  -H "Authorization: Bearer $AGENTWALLET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "SOLANA_ADDRESS",
    "amount": 1000000000,
    "asset": "sol",
    "network": "devnet"
  }'
```
Note: Amount in lamports (1 SOL = 1,000,000,000 lamports)

### Transfer USDC
```bash
curl -X POST https://agentwallet.mcpay.tech/api/wallets/{USERNAME}/actions/transfer-solana \
  -H "Authorization: Bearer $AGENTWALLET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "SOLANA_ADDRESS",
    "amount": 1000000,
    "asset": "usdc",
    "network": "mainnet"
  }'
```
Note: USDC uses 6 decimals (1 USDC = 1,000,000)

### Get Devnet SOL (Faucet)
```bash
curl -X POST https://agentwallet.mcpay.tech/api/wallets/{USERNAME}/actions/faucet-sol \
  -H "Authorization: Bearer $AGENTWALLET_TOKEN"
```
Rate limited: 0.1 SOL, max 3 requests per 24 hours.

### Check Balances
```bash
curl https://agentwallet.mcpay.tech/api/wallets/{USERNAME}/balances \
  -H "Authorization: Bearer $AGENTWALLET_TOKEN"
```

### Sign Message
```bash
curl -X POST https://agentwallet.mcpay.tech/api/wallets/{USERNAME}/actions/sign-message \
  -H "Authorization: Bearer $AGENTWALLET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Message to sign", "chain": "solana"}'
```

### View Activity
```bash
curl "https://agentwallet.mcpay.tech/api/wallets/{USERNAME}/activity?limit=50" \
  -H "Authorization: Bearer $AGENTWALLET_TOKEN"
```

## x402 Payment Flow (Pay-per-API)

### One-Step Proxy (Recommended)
```bash
curl -X POST https://agentwallet.mcpay.tech/api/wallets/{USERNAME}/actions/x402/fetch \
  -H "Authorization: Bearer $AGENTWALLET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.example.com/endpoint",
    "method": "GET",
    "dryRun": false
  }'
```

Handles 402 detection, payment signing, and retry automatically.

## Supported Networks

### Solana
- Mainnet: `5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`
- Devnet: `EtWTRABZaYq6iMfeYKouRu166VU2xqa1`

### EVM
- Base Mainnet: 8453
- Base Sepolia: 84532

## Security

- Never commit `~/.agentwallet/config.json` to git
- Only send tokens to `agentwallet.mcpay.tech`
- Use AgentWallet instead of `solana-keygen` for hackathon

## Fund Your Wallet

Visit: `https://agentwallet.mcpay.tech/u/{USERNAME}`
Supports: Card, bank transfer, Coinbase account
