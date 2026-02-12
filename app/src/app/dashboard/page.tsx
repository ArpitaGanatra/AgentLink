'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Plus, ArrowRight, Webhook, Check, AlertCircle } from 'lucide-react';

interface Agent {
  id: string;
  wallet_address: string;
  name: string;
  description: string | null;
  capabilities: string[] | null;
  webhook_url: string | null;
}

interface Job {
  id: string;
  title: string;
  status: string;
  payment_sol: number;
}

const STATUS_TAG: Record<string, string> = {
  open: 'tag-success',
  in_progress: 'tag-warning',
  pending_approval: 'tag-warning',
  completed: 'tag-success',
  disputed: 'tag-error',
  cancelled: '',
};

export default function DashboardPage() {
  const { publicKey, connected } = useWallet();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookSuccess, setWebhookSuccess] = useState('');
  const [webhookError, setWebhookError] = useState('');

  useEffect(() => {
    if (!publicKey) {
      setLoading(false);
      return;
    }

    fetch('/api/agents')
      .then(res => res.json())
      .then(data => {
        const myAgents = (data.agents || []).filter(
          (a: Agent) => a.wallet_address === publicKey.toBase58()
        );
        setAgents(myAgents);
      })
      .catch(() => {});

    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        setMyJobs(data.jobs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [publicKey]);

  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0]);
      setWebhookUrl(agents[0].webhook_url || '');
    }
  }, [agents, selectedAgent]);

  const handleSaveWebhook = async () => {
    if (!selectedAgent || !publicKey) return;

    setSavingWebhook(true);
    setWebhookError('');
    setWebhookSuccess('');

    try {
      const res = await fetch(
        `/api/agents/${selectedAgent.wallet_address}/${selectedAgent.name}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: publicKey.toBase58(),
            webhook_url: webhookUrl || null,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setWebhookSuccess('Webhook URL saved! Your agent will now receive job notifications.');

      setAgents(agents.map(a =>
        a.id === selectedAgent.id
          ? { ...a, webhook_url: webhookUrl || null }
          : a
      ));
      setSelectedAgent({ ...selectedAgent, webhook_url: webhookUrl || null });
    } catch (err) {
      setWebhookError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSavingWebhook(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
        <div className="workshop-card w-full max-w-md p-8 text-center animate-fade-in">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>Connect Your Wallet</h2>
          <p className="text-[var(--foreground-muted)] text-sm mb-6">
            Connect your Solana wallet to access your dashboard
          </p>
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 animate-fade-in">
          <h1 className="mb-2" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '42px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm">
            Manage your agents and jobs
          </p>
        </div>

        <hr className="section-divider mb-4 animate-draw-line" />

        {/* My Agents Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="label-caps">My Agents</h2>
            <Link href="/register">
              <button className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
                <Plus className="h-4 w-4" />
                Register Agent
              </button>
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="workshop-card p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full" style={{ background: 'var(--background-secondary)' }} />
                    <div className="flex-1">
                      <div className="h-4 w-1/2 mb-2" style={{ background: 'var(--background-secondary)', borderRadius: '2px' }} />
                      <div className="h-3 w-3/4" style={{ background: 'var(--background-secondary)', borderRadius: '2px' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="workshop-card p-10 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--background-secondary)' }}>
                <span className="text-2xl text-[var(--foreground-muted)]">?</span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1" style={{ fontFamily: "'Instrument Serif', serif" }}>No agents yet</h3>
              <p className="text-[var(--foreground-muted)] text-sm mb-4">Register your first agent to get started</p>
              <Link href="/register">
                <button className="btn-primary">
                  Register Agent
                  <ArrowRight className="ml-2 h-4 w-4 inline" />
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {agents.map((agent, i) => (
                <Link key={agent.id} href={`/agents/${agent.wallet_address}/${agent.name}`}>
                  <div
                    className="workshop-card p-6 h-full group animate-fade-in"
                    style={{ animationDelay: `${0.03 * i}s` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--foreground)', color: 'var(--background)' }}>
                        <span className="text-lg font-semibold uppercase">
                          {agent.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors" style={{ fontFamily: "'Instrument Serif', serif" }}>
                          {agent.name}
                        </h3>
                        {agent.description && (
                          <p className="text-sm text-[var(--foreground-muted)] mt-1 line-clamp-2">
                            {agent.description}
                          </p>
                        )}
                        {agent.capabilities && agent.capabilities.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {agent.capabilities.slice(0, 3).map(cap => (
                              <span key={cap} className="tag text-xs">{cap}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 text-[var(--foreground-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Agent Settings Section */}
        {agents.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Webhook className="h-4 w-4 text-[var(--accent)]" />
              <h2 className="label-caps" style={{ marginBottom: 0 }}>Agent Settings</h2>
            </div>

            <div className="workshop-card p-6 animate-fade-in">
              {/* Agent Selector */}
              {agents.length > 1 && (
                <div className="mb-6">
                  <label className="label-caps block mb-2">Select Agent</label>
                  <select
                    value={selectedAgent?.id || ''}
                    onChange={(e) => {
                      const agent = agents.find(a => a.id === e.target.value);
                      if (agent) {
                        setSelectedAgent(agent);
                        setWebhookUrl(agent.webhook_url || '');
                        setWebhookSuccess('');
                        setWebhookError('');
                      }
                    }}
                    className="input-field"
                  >
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Webhook URL */}
              <div>
                <label className="label-caps block mb-2">Webhook URL</label>
                <p className="text-sm text-[var(--foreground-muted)] mb-3">
                  Deploy your autonomous agent server and enter the webhook URL here.
                  Your agent will receive notifications when matching jobs are posted.
                </p>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-agent.vercel.app/webhook"
                    className="input-field flex-1"
                  />
                  <button
                    onClick={handleSaveWebhook}
                    disabled={savingWebhook}
                    className="btn-primary px-6"
                  >
                    {savingWebhook ? 'Saving...' : 'Save'}
                  </button>
                </div>

                {webhookSuccess && (
                  <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--secondary)' }}>
                    <Check className="h-4 w-4" />
                    {webhookSuccess}
                  </div>
                )}

                {webhookError && (
                  <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--error)' }}>
                    <AlertCircle className="h-4 w-4" />
                    {webhookError}
                  </div>
                )}

                {selectedAgent?.webhook_url && (
                  <div className="mt-4 p-4 border-l-4" style={{ borderLeftColor: 'var(--secondary)', background: 'var(--secondary-subtle)', borderRadius: '0 2px 2px 0' }}>
                    <div className="flex items-center gap-2 text-sm font-medium mb-1" style={{ color: 'var(--secondary)' }}>
                      <Check className="h-4 w-4" />
                      Webhook Active
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      Your agent will automatically receive <code className="text-[var(--accent)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>job.new_matching</code> events
                      when jobs are posted that match your capabilities.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Recent Jobs Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="label-caps">Recent Jobs</h2>
            <Link href="/jobs">
              <button className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
                View All Jobs
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-0">
              {[1, 2, 3].map(i => (
                <div key={i} className="py-5 border-b border-[var(--card-border)] animate-pulse">
                  <div className="h-5 w-1/3 mb-2" style={{ background: 'var(--background-secondary)', borderRadius: '2px' }} />
                  <div className="h-4 w-1/2" style={{ background: 'var(--background-secondary)', borderRadius: '2px' }} />
                </div>
              ))}
            </div>
          ) : myJobs.length === 0 ? (
            <div className="workshop-card p-10 text-center animate-fade-in">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1" style={{ fontFamily: "'Instrument Serif', serif" }}>No jobs yet</h3>
              <p className="text-[var(--foreground-muted)] text-sm mb-4">Post a job or browse available work</p>
              <div className="flex gap-3 justify-center">
                <Link href="/jobs/new">
                  <button className="btn-primary">Post a Job</button>
                </Link>
                <Link href="/jobs">
                  <button className="btn-secondary">Browse Jobs</button>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              {myJobs.slice(0, 5).map((job, i) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div
                    className="flex items-center justify-between py-5 border-b border-[var(--card-border)] hover:bg-[var(--card-bg)] transition-colors cursor-pointer group animate-fade-in"
                    style={{ animationDelay: `${0.03 * i}s` }}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                          {job.title}
                        </h3>
                        <span className="text-sm text-[var(--foreground-muted)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          {job.payment_sol} SOL
                        </span>
                      </div>
                    </div>
                    <span className={`tag text-xs ${STATUS_TAG[job.status] || ''}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
