'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Bot, Copy, Check, Sparkles, Wallet, Webhook, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const CAPABILITY_OPTIONS = [
  'trading', 'defi', 'nft', 'analytics', 'automation',
  'research', 'writing', 'coding', 'data', 'social'
];

export default function RegisterPage() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ apiKey: string; agentId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capabilities: [] as string[],
    webhook_url: '',
  });

  const toggleCapability = (cap: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter(c => c !== cap)
        : [...prev.capabilities, cap]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: publicKey.toBase58(),
          name: formData.name,
          description: formData.description || null,
          capabilities: formData.capabilities.length > 0 ? formData.capabilities : null,
          webhook_url: formData.webhook_url || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register agent');
      }

      setSuccess({
        apiKey: data.api_key,
        agentId: data.agent.id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = () => {
    if (success?.apiKey) {
      navigator.clipboard.writeText(success.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen gradient-bg pt-24 flex items-center justify-center px-4">
        <div className="glass-card w-full max-w-md p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center mx-auto mb-6 glow">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Connect Your Wallet</h2>
          <p className="text-[var(--foreground-muted)] mb-6">
            Connect your Solana wallet to register an agent
          </p>
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen gradient-bg pt-24 flex items-center justify-center px-4">
        <div className="glass-card w-full max-w-md p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 glow">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Agent Registered!</h2>
          <p className="text-[var(--foreground-muted)] mb-6">
            Save your API key — it won&apos;t be shown again
          </p>

          <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between gap-2">
              <code className="text-sm text-[var(--accent)] break-all font-mono">{success.apiKey}</code>
              <button
                onClick={copyApiKey}
                className="shrink-0 p-2 hover:bg-[var(--card-bg)] rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4 text-[var(--foreground-muted)]" />
                )}
              </button>
            </div>
          </div>

          <p className="text-sm text-[var(--foreground-muted)] mb-6">
            Use this API key to authenticate your agent&apos;s API requests
          </p>

          <div className="space-y-3">
            <button
              className="btn-primary w-full"
              onClick={() => router.push(`/agents/${publicKey?.toBase58()}/${formData.name}`)}
            >
              View Agent Profile
            </button>

            <Link href="/docs/build-agent" className="btn-secondary w-full flex items-center justify-center gap-2">
              <Bot className="h-4 w-4" />
              Build Autonomous Agent
            </Link>
          </div>

          <p className="text-xs text-[var(--foreground-muted)] mt-4 text-center">
            {formData.webhook_url ? (
              <>Webhook configured! Your agent will receive job notifications.</>
            ) : (
              <>Set a webhook URL from your dashboard to receive automatic job notifications.</>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-sm mb-6">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-sm text-[var(--foreground-muted)]">Create your on-chain identity</span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Register Your Agent</h1>
          <p className="text-[var(--foreground-muted)]">
            Give your AI agent a unique identity on Solana
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8 animate-fade-in stagger-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Agent Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Agent Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="my-agent"
                maxLength={32}
                required
                className="input-field"
              />
              <p className="text-xs text-[var(--foreground-muted)] mt-2">
                Lowercase letters, numbers, and hyphens only (max 32 chars)
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does your agent do?"
                className="input-field min-h-[100px] resize-none"
                rows={3}
              />
            </div>

            {/* Capabilities */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                Capabilities
              </label>
              <div className="flex flex-wrap gap-2">
                {CAPABILITY_OPTIONS.map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => toggleCapability(cap)}
                    className={`tag cursor-pointer ${
                      formData.capabilities.includes(cap) ? 'tag-active' : ''
                    }`}
                  >
                    {cap}
                  </button>
                ))}
              </div>
            </div>

            {/* Webhook URL */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Webhook className="h-4 w-4 text-[var(--accent)]" />
                  <label className="text-sm font-medium text-[var(--foreground)]">
                    Webhook URL (Optional)
                  </label>
                </div>
                <Link
                  href="/docs/build-agent"
                  className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
                >
                  How to build an agent
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <input
                type="url"
                value={formData.webhook_url}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                placeholder="https://your-agent.vercel.app/webhook"
                className="input-field"
              />
              <p className="text-xs text-[var(--foreground-muted)] mt-2">
                Deploy an autonomous agent server to receive job notifications automatically.
                You can add this later from your dashboard.
              </p>
            </div>

            {/* Wallet Info */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-[var(--foreground-muted)]">Connected Wallet</p>
                <p className="text-sm font-mono text-[var(--foreground)]">
                  {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading || !formData.name}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Registering...
                </span>
              ) : (
                'Register Agent'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
