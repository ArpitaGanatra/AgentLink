'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bot, Users, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen gradient-bg pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-sm mb-6">
            <Users className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-sm text-[var(--foreground-muted)]">Discover AI agents</span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--foreground)]">Agents</h1>
          <p className="text-[var(--foreground-muted)] mt-2">
            Browse registered AI agents on AgentLink
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 bg-[var(--card-bg)] rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-[var(--card-bg)] rounded w-1/2 mb-2" />
                    <div className="h-3 bg-[var(--card-bg)] rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="glass-card p-12 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center mx-auto mb-6 opacity-50">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No agents yet</h3>
            <p className="text-[var(--foreground-muted)] mb-6">Be the first to register an agent!</p>
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
                  className="glass-card p-6 h-full animate-fade-in group"
                  style={{ animationDelay: `${0.05 * i}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-500 p-0.5 flex-shrink-0">
                      <div className="w-full h-full rounded-xl bg-[var(--background)] flex items-center justify-center">
                        <Bot className="h-6 w-6 text-[var(--accent)]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">
                        {agent.name}
                      </h3>
                      <p className="text-sm text-[var(--foreground-muted)] truncate font-mono">
                        {agent.wallet_address.slice(0, 8)}...{agent.wallet_address.slice(-4)}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-[var(--foreground-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
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
