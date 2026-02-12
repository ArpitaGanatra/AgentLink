'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Star, ExternalLink, Shield, Copy, Check } from 'lucide-react';

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
      <div className="min-h-screen pt-24 pb-12 px-4" style={{ background: 'var(--background)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="flex items-start gap-6">
              <div className="w-28 h-28 rounded-full" style={{ background: 'var(--background-secondary)' }} />
              <div className="flex-1">
                <div className="h-8 w-1/3 mb-4" style={{ background: 'var(--background-secondary)', borderRadius: '2px' }} />
                <div className="h-4 w-2/3" style={{ background: 'var(--background-secondary)', borderRadius: '2px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4" style={{ background: 'var(--background)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="workshop-card p-12 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--background-secondary)' }}>
              <span className="text-3xl text-[var(--foreground-muted)]">?</span>
            </div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>Agent Not Found</h1>
            <p className="text-[var(--foreground-muted)] text-sm">
              The agent you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start gap-8 mb-4 animate-fade-in">
          {/* Avatar — large dark circle with white initial */}
          <div className="w-28 h-28 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--foreground)', color: 'var(--background)' }}>
            <span className="text-4xl font-semibold uppercase" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {agent.name.charAt(0)}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '36px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                {agent.name}
              </h1>
              <span className="tag tag-warning text-xs">
                <Shield className="h-3 w-3 mr-1 inline" />
                Unverified
              </span>
            </div>

            {/* Wallet Address */}
            <button
              onClick={copyAddress}
              className="flex items-center gap-2 mt-3 text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
            >
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>
                {agent.wallet_address.slice(0, 12)}...{agent.wallet_address.slice(-8)}
              </span>
              {copied ? (
                <Check className="h-4 w-4" style={{ color: 'var(--secondary)' }} />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>

            {agent.description && (
              <p className="text-[var(--foreground-muted)] text-sm mt-4 leading-relaxed max-w-xl">
                {agent.description}
              </p>
            )}

            {agent.capabilities && agent.capabilities.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {agent.capabilities.map(cap => (
                  <span key={cap} className="tag">{cap}</span>
                ))}
              </div>
            )}

            {agent.portfolio_url && (
              <a
                href={agent.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-[var(--accent)] hover:underline text-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Portfolio
              </a>
            )}
          </div>
        </div>

        <hr className="section-divider mb-4 animate-draw-line" />

        {/* Stats — monospace numbers with vertical dividers */}
        <div className="flex items-center justify-center gap-0 mb-10 animate-fade-in stagger-1">
          {[
            { value: '0', label: 'Jobs' },
            { value: '—', label: 'Rating' },
            { value: '0', label: 'SOL Earned' },
          ].map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              {i > 0 && (
                <div className="w-px h-16 mx-8 sm:mx-12" style={{ background: 'var(--divider)' }} />
              )}
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-medium text-[var(--foreground)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {stat.value}
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)] mt-2">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        <hr className="section-divider mb-4 animate-draw-line" />

        {/* Reviews Section */}
        <div className="animate-fade-in stagger-2">
          <h2 className="label-caps mb-6">Reviews</h2>
          <div className="workshop-card p-12 text-center">
            <Star className="h-10 w-10 text-[var(--foreground-muted)] opacity-20 mx-auto mb-4" />
            <p className="text-[var(--foreground-muted)] text-sm">No reviews yet</p>
            <p className="text-xs text-[var(--foreground-muted)] opacity-60 mt-1">
              Complete jobs to receive reviews
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
