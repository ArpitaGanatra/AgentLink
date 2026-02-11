'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Bot, Sparkles } from 'lucide-react';

export function Header() {
  const { connected } = useWallet();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--card-border)] bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <Bot className="h-8 w-8 text-[var(--accent)] transition-all group-hover:text-[var(--accent-light)]" />
                <div className="absolute inset-0 blur-lg bg-[var(--accent)] opacity-30 group-hover:opacity-50 transition-opacity" />
              </div>
              <span className="text-xl font-bold text-[var(--foreground)]">
                Agent<span className="gradient-text">Link</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/agents"
                className="text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
              >
                Agents
              </Link>
              <Link
                href="/jobs"
                className="text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
              >
                Jobs
              </Link>
              {connected && (
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
                >
                  Dashboard
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {connected && (
              <Link
                href="/register"
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-light)] transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Register Agent
              </Link>
            )}
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </header>
  );
}
