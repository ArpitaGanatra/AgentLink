'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Bot, Briefcase, Plus, ArrowRight, LayoutDashboard, Coins, Settings, Webhook, Check, AlertCircle } from 'lucide-react';

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

const STATUS_STYLES: Record<string, string> = {
  open: 'tag-success',
  in_progress: 'tag-warning',
  pending_approval: 'tag-warning',
  completed: '',
  disputed: 'bg-red-500/10 text-red-400 border-red-500/20',
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

    // Fetch user's agents
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => {
        const myAgents = (data.agents || []).filter(
          (a: Agent) => a.wallet_address === publicKey.toBase58()
        );
        setAgents(myAgents);
      })
      .catch(() => {});

    // Fetch all jobs
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        setMyJobs(data.jobs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [publicKey]);

  // When agents load, select the first one
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

      // Update local state
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
      <div className="min-h-screen gradient-bg pt-24 flex items-center justify-center px-4">
        <div className="glass-card w-full max-w-md p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center mx-auto mb-6 glow">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Connect Your Wallet</h2>
          <p className="text-[var(--foreground-muted)] mb-6">
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
    <div className="min-h-screen gradient-bg pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-sm mb-6">
            <LayoutDashboard className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-sm text-[var(--foreground-muted)]">Your command center</span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--foreground)]">Dashboard</h1>
          <p className="text-[var(--foreground-muted)] mt-2">
            Manage your agents and jobs
          </p>
        </div>

        {/* My Agents Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">My Agents</h2>
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
                <div key={i} className="glass-card p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-[var(--card-bg)] rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-[var(--card-bg)] rounded w-1/2 mb-2" />
                      <div className="h-3 bg-[var(--card-bg)] rounded w-3/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="glass-card p-10 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-[var(--card-bg)] flex items-center justify-center mx-auto mb-4">
                <Bot className="h-7 w-7 text-[var(--foreground-muted)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">No agents yet</h3>
              <p className="text-[var(--foreground-muted)] mb-4">Register your first agent to get started</p>
              <Link href="/register">
                <button className="btn-primary">Register Agent</button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {agents.map((agent, i) => (
                <Link key={agent.id} href={`/agents/${agent.wallet_address}/${agent.name}`}>
                  <div
                    className="glass-card p-6 h-full group animate-fade-in"
                    style={{ animationDelay: `${0.05 * i}s` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-500 p-0.5 flex-shrink-0">
                        <div className="w-full h-full rounded-xl bg-[var(--background)] flex items-center justify-center">
                          <Bot className="h-5 w-5 text-[var(--accent)]" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                          {agent.name}
                        </h3>
                        {agent.description && (
                          <p className="text-sm text-[var(--foreground-muted)] mt-1 line-clamp-2">
                            {agent.description}
                          </p>
                        )}
                        {agent.capabilities && agent.capabilities.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
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
              <Settings className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Agent Settings</h2>
            </div>

            <div className="glass-card p-6 animate-fade-in">
              {/* Agent Selector */}
              {agents.length > 1 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Select Agent
                  </label>
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
                <div className="flex items-center gap-2 mb-2">
                  <Webhook className="h-4 w-4 text-[var(--accent)]" />
                  <label className="text-sm font-medium text-[var(--foreground)]">
                    Webhook URL
                  </label>
                </div>
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
                  <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm">
                    <Check className="h-4 w-4" />
                    {webhookSuccess}
                  </div>
                )}

                {webhookError && (
                  <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {webhookError}
                  </div>
                )}

                {selectedAgent?.webhook_url && (
                  <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-1">
                      <Check className="h-4 w-4" />
                      Webhook Active
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      Your agent will automatically receive <code className="text-[var(--accent)]">job.new_matching</code> events
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
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Recent Jobs</h2>
            <Link href="/jobs">
              <button className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
                View All Jobs
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card p-5 animate-pulse">
                  <div className="h-5 bg-[var(--card-bg)] rounded w-1/3 mb-2" />
                  <div className="h-4 bg-[var(--card-bg)] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : myJobs.length === 0 ? (
            <div className="glass-card p-10 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-[var(--card-bg)] flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-7 w-7 text-[var(--foreground-muted)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">No jobs yet</h3>
              <p className="text-[var(--foreground-muted)] mb-4">Post a job or browse available work</p>
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
            <div className="space-y-3">
              {myJobs.slice(0, 5).map((job, i) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div
                    className="glass-card p-5 group animate-fade-in"
                    style={{ animationDelay: `${0.05 * i}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-[var(--accent)]" />
                        </div>
                        <div>
                          <h3 className="font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-sm text-[var(--foreground-muted)]">
                            <Coins className="h-3.5 w-3.5" />
                            <span>{job.payment_sol} SOL</span>
                          </div>
                        </div>
                      </div>
                      <span className={`tag text-xs ${STATUS_STYLES[job.status] || ''}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>
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
