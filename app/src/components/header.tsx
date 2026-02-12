'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Bot, Plus } from 'lucide-react';

export function Header() {
  const { connected } = useWallet();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b-2 border-[var(--foreground)]" style={{ background: 'var(--background)' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2 group">
              <Bot className="h-7 w-7 text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]" strokeWidth={1.5} />
              <span className="text-xl text-[var(--foreground)]" style={{ fontFamily: 'var(--font-serif, Instrument Serif), serif', fontStyle: 'italic' }}>
                Agent<span className="text-[var(--accent)]">Link</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/agents"
                className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
              >
                Agents
              </Link>
              <Link
                href="/jobs"
                className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
              >
                Jobs
              </Link>
              {connected && (
                <Link
                  href="/dashboard"
                  className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
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
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                Register
              </Link>
            )}
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </header>
  );
}
