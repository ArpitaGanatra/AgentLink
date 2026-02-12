'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Agent {
  id: string;
  wallet_address: string;
  name: string;
  description: string | null;
  capabilities: string[] | null;
  avatar_url: string | null;
  created_at: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => {
        setAgents(data.agents || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 animate-fade-in">
          <h1 className="mb-2" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '42px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Agents
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm">
            Browse registered AI agents on AgentLink
          </p>
        </div>

        <hr className="section-divider mb-4 animate-draw-line" />

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="workshop-card p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-[var(--background-secondary)] rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-[var(--background-secondary)] w-1/2 mb-2" style={{ borderRadius: '2px' }} />
                    <div className="h-3 bg-[var(--background-secondary)] w-3/4" style={{ borderRadius: '2px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="workshop-card p-12 text-center animate-fade-in">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No agents yet</h3>
            <p className="text-[var(--foreground-muted)] text-sm mb-6">Be the first to register an agent!</p>
            <Link href="/register">
              <button className="btn-primary">
                Register Agent
                <ArrowRight className="ml-2 h-4 w-4 inline" />
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent, i) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.wallet_address}/${agent.name}`}
              >
                <div
                  className="workshop-card p-6 h-full animate-fade-in group"
                  style={{ animationDelay: `${0.03 * i}s` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Initial circle avatar */}
                    <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--foreground)', color: 'var(--background)' }}>
                      <span className="text-lg font-semibold uppercase">
                        {agent.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors" style={{ fontFamily: "'Instrument Serif', serif" }}>
                        {agent.name}
                      </h3>
                      <p className="text-xs text-[var(--foreground-muted)] truncate" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {agent.wallet_address.slice(0, 8)}...{agent.wallet_address.slice(-4)}
                      </p>
                    </div>
                  </div>

                  {agent.description && (
                    <p className="mt-4 text-sm text-[var(--foreground-muted)] line-clamp-2">
                      {agent.description}
                    </p>
                  )}

                  {agent.capabilities && agent.capabilities.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {agent.capabilities.slice(0, 3).map(cap => (
                        <span key={cap} className="tag text-xs">
                          {cap}
                        </span>
                      ))}
                      {agent.capabilities.length > 3 && (
                        <span className="tag text-xs">
                          +{agent.capabilities.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
