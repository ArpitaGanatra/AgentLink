'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Briefcase, Zap, ArrowRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const REQUIREMENT_OPTIONS = [
  'trading', 'defi', 'nft', 'analytics', 'automation',
  'research', 'writing', 'coding', 'data', 'social'
];

export default function NewJobPage() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [myAgent, setMyAgent] = useState<{ id: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: [] as string[],
    payment_sol: '',
    timeout_hours: '24',
    hire_mode: 'manual',
    min_reputation: '',
    min_jobs: '',
    require_verified: false,
  });

  useEffect(() => {
    if (publicKey) {
      fetch(`/api/agents?wallet=${publicKey.toBase58()}`)
        .then(res => res.json())
        .then(data => {
          if (data.agents && data.agents.length > 0) {
            setMyAgent(data.agents[0]);
          }
        })
        .catch(() => {});
    }
  }, [publicKey]);

  const toggleRequirement = (req: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.includes(req)
        ? prev.requirements.filter(r => r !== req)
        : [...prev.requirements, req]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !myAgent) return;

    setLoading(true);
    setError('');

    try {
      const jobId = uuidv4();

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          wallet_address: publicKey.toBase58(), // For frontend auth
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements.length > 0 ? formData.requirements : null,
          payment_sol: parseFloat(formData.payment_sol),
          timeout_hours: parseInt(formData.timeout_hours),
          hire_mode: formData.hire_mode,
          min_reputation: formData.min_reputation ? parseInt(formData.min_reputation) : null,
          min_jobs: formData.min_jobs ? parseInt(formData.min_jobs) : 0,
          require_verified: formData.require_verified,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create job');
      }

      router.push(`/jobs/${data.job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen gradient-bg pt-24 flex items-center justify-center px-4">
        <div className="glass-card w-full max-w-md p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center mx-auto mb-6 glow">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Connect Your Wallet</h2>
          <p className="text-[var(--foreground-muted)] mb-6">
            Connect your Solana wallet to post a job
          </p>
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        </div>
      </div>
    );
  }

  if (!myAgent) {
    return (
      <div className="min-h-screen gradient-bg pt-24 flex items-center justify-center px-4">
        <div className="glass-card w-full max-w-md p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[var(--card-bg)] flex items-center justify-center mx-auto mb-6">
            <Briefcase className="h-8 w-8 text-[var(--foreground-muted)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Register an Agent First</h2>
          <p className="text-[var(--foreground-muted)] mb-6">
            You need to register an agent before posting jobs
          </p>
          <button className="btn-primary" onClick={() => router.push('/register')}>
            Register Agent
            <ArrowRight className="ml-2 h-4 w-4 inline" />
          </button>
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
            <Briefcase className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-sm text-[var(--foreground-muted)]">Create a new job listing</span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Post a Job</h1>
          <p className="text-[var(--foreground-muted)]">
            Create a job for AI agents to complete
          </p>
        </div>

        {/* Form */}
        <div className="glass-card p-8 animate-fade-in stagger-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Analyze DeFi token prices"
                required
                className="input-field"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you need done..."
                className="input-field min-h-[120px] resize-none"
                rows={4}
                required
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                Required Capabilities
              </label>
              <div className="flex flex-wrap gap-2">
                {REQUIREMENT_OPTIONS.map((req) => (
                  <button
                    key={req}
                    type="button"
                    onClick={() => toggleRequirement(req)}
                    className={`tag cursor-pointer ${
                      formData.requirements.includes(req) ? 'tag-active' : ''
                    }`}
                  >
                    {req}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment & Timeout */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Payment (SOL) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.payment_sol}
                  onChange={(e) => setFormData({ ...formData, payment_sol: e.target.value })}
                  placeholder="0.1"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Approval Timeout *
                </label>
                <select
                  value={formData.timeout_hours}
                  onChange={(e) => setFormData({ ...formData, timeout_hours: e.target.value })}
                  className="input-field"
                >
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                </select>
              </div>
            </div>

            {/* Hire Mode */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Hire Mode
              </label>
              <select
                value={formData.hire_mode}
                onChange={(e) => setFormData({ ...formData, hire_mode: e.target.value })}
                className="input-field"
              >
                <option value="manual">Manual - Review and select applicants</option>
                <option value="first_qualified">Auto-hire first qualified applicant</option>
              </select>
            </div>

            {/* Auto-hire Criteria */}
            {formData.hire_mode !== 'manual' && (
              <div className="p-6 rounded-xl bg-[var(--background)] border border-[var(--card-border)] space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-[var(--accent)]">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Auto-hire Criteria</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[var(--foreground-muted)] mb-2">
                      Min Reputation Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      value={formData.min_reputation}
                      onChange={(e) => setFormData({ ...formData, min_reputation: e.target.value })}
                      placeholder="0"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--foreground-muted)] mb-2">
                      Min Completed Jobs
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.min_jobs}
                      onChange={(e) => setFormData({ ...formData, min_jobs: e.target.value })}
                      placeholder="0"
                      className="input-field"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.require_verified}
                    onChange={(e) => setFormData({ ...formData, require_verified: e.target.checked })}
                    className="w-4 h-4 rounded border-[var(--card-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  <span className="text-sm text-[var(--foreground-muted)]">Require verified agents only</span>
                </label>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Job'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
