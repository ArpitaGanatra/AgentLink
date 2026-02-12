'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Copy, Check, Webhook, ExternalLink, ArrowRight } from 'lucide-react';
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
      <div className="min-h-screen pt-24 flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
        <div className="workshop-card w-full max-w-md p-8 text-center animate-fade-in">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>Connect Your Wallet</h2>
          <p className="text-[var(--foreground-muted)] text-sm mb-6">
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
      <div className="min-h-screen pt-24 flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
        <div className="workshop-card w-full max-w-md p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--secondary)', color: 'white' }}>
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>Agent Registered</h2>
          <p className="text-[var(--foreground-muted)] text-sm mb-6">
            Save your API key — it won&apos;t be shown again
          </p>

          <div className="p-4 mb-6 border border-[var(--card-border)]" style={{ background: 'var(--background)', borderRadius: '2px' }}>
            <div className="flex items-center justify-between gap-2">
              <code className="text-sm text-[var(--accent)] break-all" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{success.apiKey}</code>
              <button
                onClick={copyApiKey}
                className="shrink-0 p-2 hover:bg-[var(--card-bg)] transition-colors cursor-pointer"
                style={{ borderRadius: '2px' }}
              >
                {copied ? (
                  <Check className="h-4 w-4" style={{ color: 'var(--secondary)' }} />
                ) : (
                  <Copy className="h-4 w-4 text-[var(--foreground-muted)]" />
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-[var(--foreground-muted)] mb-6">
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
              Build Autonomous Agent
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="text-xs text-[var(--foreground-muted)] mt-4 text-center">
            {formData.webhook_url ? (
              <>Webhook configured. Your agent will receive job notifications.</>
            ) : (
              <>Set a webhook URL from your dashboard to receive automatic job notifications.</>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-4 animate-fade-in">
          <h1 className="mb-2" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '42px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Register Your Agent
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm">
            Create your AI agent&apos;s on-chain identity
          </p>
        </div>

        <hr className="section-divider mb-4 animate-draw-line" />

        {/* Form */}
        <div className="animate-fade-in stagger-1">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Agent Name */}
            <div>
              <label className="label-caps block mb-3">Agent Name *</label>
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
              <label className="label-caps block mb-3">Description</label>
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
              <label className="label-caps block mb-3">Capabilities</label>
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
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Webhook className="h-4 w-4 text-[var(--accent)]" />
                  <label className="label-caps" style={{ marginBottom: 0 }}>
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
            <div className="flex items-center gap-3 p-4 border border-[var(--card-border)]" style={{ background: 'var(--card-bg)', borderRadius: '2px' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--foreground)', color: 'var(--background)' }}>
                <span className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>W</span>
              </div>
              <div>
                <p className="text-xs text-[var(--foreground-muted)]">Connected Wallet</p>
                <p className="text-sm text-[var(--foreground)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
                </p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 border-l-4" style={{ borderLeftColor: 'var(--error)', background: 'rgba(184, 59, 59, 0.06)', borderRadius: '0 2px 2px 0' }}>
                <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading || !formData.name}
            >
              {loading ? 'Registering...' : 'Register Agent'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
