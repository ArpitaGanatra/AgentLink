---
name: frontend
description: Build modern Solana dApp frontends with React, Next.js, wallet adapters, and Tailwind CSS
allowed-tools: Bash, Read, Write, Glob, Grep
---

# Solana Frontend Development

Build production-grade dApp frontends for Solana projects.

## Recommended Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Wallet | @solana/wallet-adapter |
| State | Zustand or Jotai |
| Data Fetching | TanStack Query |
| Solana Client | @solana/kit |

## Quick Start

### Create Next.js Project
```bash
npx create-next-app@latest my-solana-app --typescript --tailwind --eslint --app --src-dir
cd my-solana-app
```

### Install Solana Dependencies
```bash
npm install @solana/wallet-adapter-base @solana/wallet-adapter-react \
  @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets \
  @solana/web3.js @solana/spl-token
```

### Install UI Components
```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog input toast
```

## Wallet Integration

### Provider Setup (app/providers.tsx)
```tsx
'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const SolanaProviders: FC<Props> = ({ children }) => {
  const endpoint = useMemo(() =>
    process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl('devnet'),
    []
  );

  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
```

### Root Layout (app/layout.tsx)
```tsx
import { SolanaProviders } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SolanaProviders>
          {children}
        </SolanaProviders>
      </body>
    </html>
  );
}
```

### Wallet Button Component
```tsx
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletButton() {
  return <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />;
}
```

## Common Patterns

### Fetch Balance Hook
```tsx
'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';

export function useBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  return useQuery({
    queryKey: ['balance', publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return 0;
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    },
    enabled: !!publicKey,
    refetchInterval: 10000,
  });
}
```

### Send Transaction Hook
```tsx
'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useMutation } from '@tanstack/react-query';

export function useSendSol() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  return useMutation({
    mutationFn: async ({ to, amount }: { to: string; amount: number }) => {
      if (!publicKey) throw new Error('Wallet not connected');

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(to),
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      return signature;
    },
  });
}
```

### Token Balance Hook
```tsx
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';

export function useTokenBalance(mintAddress: string, decimals: number = 9) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  return useQuery({
    queryKey: ['tokenBalance', publicKey?.toBase58(), mintAddress],
    queryFn: async () => {
      if (!publicKey) return 0;
      const mint = new PublicKey(mintAddress);
      const ata = await getAssociatedTokenAddress(mint, publicKey);
      try {
        const account = await getAccount(connection, ata);
        return Number(account.amount) / Math.pow(10, decimals);
      } catch {
        return 0;
      }
    },
    enabled: !!publicKey,
  });
}
```

## UI Components

### Balance Display
```tsx
'use client';

import { useBalance } from '@/hooks/useBalance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function BalanceCard() {
  const { data: balance, isLoading } = useBalance();

  return (
    <Card>
      <CardHeader>
        <CardTitle>SOL Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">
          {isLoading ? '...' : `${balance?.toFixed(4)} SOL`}
        </p>
      </CardContent>
    </Card>
  );
}
```

### Transaction Form
```tsx
'use client';

import { useState } from 'react';
import { useSendSol } from '@/hooks/useSendSol';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function SendForm() {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const { mutate: send, isPending } = useSendSol();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(
      { to, amount: parseFloat(amount) },
      {
        onSuccess: (sig) => toast.success(`Sent! ${sig.slice(0, 8)}...`),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Recipient address"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />
      <Input
        type="number"
        placeholder="Amount (SOL)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Sending...' : 'Send SOL'}
      </Button>
    </form>
  );
}
```

## Styling Guidelines

### Tailwind Config (tailwind.config.ts)
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        solana: {
          purple: '#9945FF',
          green: '#14F195',
          blue: '#00D1FF',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### Common Classes
```
// Solana-branded button
className="bg-gradient-to-r from-solana-purple to-solana-green text-white"

// Card with glow effect
className="bg-gray-900 border border-gray-800 shadow-lg shadow-purple-500/10"

// Glassmorphism
className="bg-white/10 backdrop-blur-lg border border-white/20"
```

## Environment Variables

Create `.env.local`:
```bash
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_NETWORK=devnet
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── components/
│   ├── ui/              # shadcn components
│   ├── WalletButton.tsx
│   ├── BalanceCard.tsx
│   └── SendForm.tsx
├── hooks/
│   ├── useBalance.ts
│   ├── useSendSol.ts
│   └── useTokenBalance.ts
└── lib/
    └── utils.ts
```

## Best Practices

1. **Always use 'use client'** for wallet-dependent components
2. **Handle loading states** - wallets take time to connect
3. **Show transaction confirmations** - use toast notifications
4. **Handle errors gracefully** - network issues are common
5. **Test on devnet first** - never test with real funds
6. **Use TanStack Query** - for caching and refetching
7. **Mobile responsive** - many users are on mobile wallets
