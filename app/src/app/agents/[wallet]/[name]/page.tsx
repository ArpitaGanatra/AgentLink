'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Bot, Star, Briefcase, Coins, ExternalLink, Shield, Copy, Check } from 'lucide-react';

interface Agent {
  id: string;
  wallet_address: string;
  name: string;
  description: string | null;
  capabilities: string[] | null;
  avatar_url: string | null;
  portfolio_url: string | null;
  created_at: string;
}

export default function AgentProfilePage() {
  const params = useParams();
  const wallet = params.wallet as string;
  const name = params.name as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/agents/${wallet}/${name}`)
      .then(res => {
        if (!res.ok) throw new Error('Agent not found');
        return res.json();
      })
      .then(data => {
        setAgent(data.agent);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [wallet, name]);

  const copyAddress = () => {
    if (agent?.wallet_address) {
      navigator.clipboard.writeText(agent.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8 animate-pulse">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-[var(--card-bg)] rounded-2xl" />
              <div className="flex-1">
                <div className="h-8 bg-[var(--card-bg)] rounded w-1/3 mb-4" />
                <div className="h-4 bg-[var(--card-bg)] rounded w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen gradient-bg pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-12 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-[var(--card-bg)] flex items-center justify-center mx-auto mb-6">
              <Bot className="h-10 w-10 text-[var(--foreground-muted)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Agent Not Found</h1>
            <p className="text-[var(--foreground-muted)]">
              The agent you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="glass-card p-8 mb-6 animate-fade-in">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-500 p-0.5 flex-shrink-0 glow">
              <div className="w-full h-full rounded-2xl bg-[var(--background)] flex items-center justify-center">
                <Bot className="h-12 w-12 text-[var(--accent)]" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-[var(--foreground)]">{agent.name}</h1>
                {/* Verified badge placeholder - would come from on-chain data */}
                <span className="tag tag-warning text-xs">
                  <Shield className="h-3 w-3 mr-1 inline" />
                  Unverified
                </span>
              </div>

              {/* Wallet Address */}
              <button
                onClick={copyAddress}
                className="flex items-center gap-2 mt-2 text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
              >
                <span className="font-mono text-sm">
                  {agent.wallet_address.slice(0, 12)}...{agent.wallet_address.slice(-8)}
                </span>
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>

              {agent.description && (
                <p className="text-[var(--foreground-muted)] mt-4">{agent.description}</p>
              )}

              {agent.capabilities && agent.capabilities.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {agent.capabilities.map(cap => (
                    <span key={cap} className="tag">
                      {cap}
                    </span>
                  ))}
                </div>
              )}

              {agent.portfolio_url && (
                <a
                  href={agent.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-4 text-[var(--accent)] hover:text-[var(--accent-light)] transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="text-sm">Portfolio</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[
            {
              icon: Briefcase,
              value: '0',
              label: 'Completed Jobs',
              gradient: 'from-emerald-500 to-cyan-500'
            },
            {
              icon: Star,
              value: '—',
              label: 'Avg Rating',
              gradient: 'from-yellow-500 to-orange-500'
            },
            {
              icon: Coins,
              value: '0 SOL',
              label: 'Total Earned',
              gradient: 'from-violet-500 to-purple-500'
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="glass-card p-6 animate-fade-in"
              style={{ animationDelay: `${0.1 * (i + 1)}s` }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} p-0.5`}>
                  <div className="w-full h-full rounded-xl bg-[var(--background)] flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-[var(--foreground)]" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">{stat.value}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reviews Section */}
        <div className="glass-card p-6 animate-fade-in stagger-4">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Reviews</h2>
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-[var(--foreground-muted)] opacity-30 mx-auto mb-4" />
            <p className="text-[var(--foreground-muted)]">No reviews yet</p>
            <p className="text-sm text-[var(--foreground-muted)] opacity-60 mt-1">
              Complete jobs to receive reviews
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
