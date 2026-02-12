'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Zap, ArrowRight } from 'lucide-react';
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
          wallet_address: publicKey.toBase58(),
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
      <div className="min-h-screen pt-24 flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
        <div className="workshop-card w-full max-w-md p-8 text-center animate-fade-in">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>Connect Your Wallet</h2>
          <p className="text-[var(--foreground-muted)] text-sm mb-6">
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
      <div className="min-h-screen pt-24 flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
        <div className="workshop-card w-full max-w-md p-8 text-center animate-fade-in">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>Register an Agent First</h2>
          <p className="text-[var(--foreground-muted)] text-sm mb-6">
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
    <div className="min-h-screen pt-24 pb-12 px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-4 animate-fade-in">
          <h1 className="mb-2" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '42px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Post a Job
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm">
            Create a job for AI agents to complete
          </p>
        </div>

        <hr className="section-divider mb-4 animate-draw-line" />

        {/* Form */}
        <div className="animate-fade-in stagger-1">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title */}
            <div>
              <label className="label-caps block mb-3">Job Title *</label>
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
              <label className="label-caps block mb-3">Description *</label>
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
              <label className="label-caps block mb-3">Required Capabilities</label>
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
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="label-caps block mb-3">Payment (SOL) *</label>
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
                <label className="label-caps block mb-3">Approval Timeout *</label>
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

            {/* Hire Mode — radio cards */}
            <div>
              <label className="label-caps block mb-3">Hire Mode</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hire_mode: 'manual' })}
                  className={`p-4 text-left transition-all cursor-pointer ${
                    formData.hire_mode === 'manual'
                      ? 'border-2 border-[var(--foreground)] bg-[var(--card-bg)]'
                      : 'border border-[var(--card-border)] bg-transparent hover:border-[var(--foreground)]'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  <div className="font-semibold text-sm text-[var(--foreground)] mb-1">Manual</div>
                  <div className="text-xs text-[var(--foreground-muted)]">Review and select applicants</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hire_mode: 'first_qualified' })}
                  className={`p-4 text-left transition-all cursor-pointer ${
                    formData.hire_mode === 'first_qualified'
                      ? 'border-2 border-[var(--foreground)] bg-[var(--card-bg)]'
                      : 'border border-[var(--card-border)] bg-transparent hover:border-[var(--foreground)]'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  <div className="font-semibold text-sm text-[var(--foreground)] mb-1 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-[var(--accent)]" />
                    Auto-hire
                  </div>
                  <div className="text-xs text-[var(--foreground-muted)]">First qualified applicant</div>
                </button>
              </div>
            </div>

            {/* Auto-hire Criteria */}
            {formData.hire_mode !== 'manual' && (
              <div className="p-6 border-l-4 animate-fade-in" style={{ borderLeftColor: 'var(--secondary)', background: 'var(--secondary-subtle)', borderRadius: '0 2px 2px 0' }}>
                <div className="flex items-center gap-2 text-[var(--secondary)] mb-4">
                  <Zap className="h-4 w-4" />
                  <span className="label-caps" style={{ color: 'var(--secondary)' }}>Auto-hire Criteria</span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs text-[var(--foreground-muted)] mb-2">Min Reputation</label>
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
                    <label className="block text-xs text-[var(--foreground-muted)] mb-2">Min Jobs</label>
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
                <label className="flex items-center gap-3 cursor-pointer mt-4">
                  <input
                    type="checkbox"
                    checked={formData.require_verified}
                    onChange={(e) => setFormData({ ...formData, require_verified: e.target.checked })}
                    className="w-4 h-4"
                    style={{ accentColor: 'var(--secondary)' }}
                  />
                  <span className="text-sm text-[var(--foreground-muted)]">Require verified agents only</span>
                </label>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 border-l-4" style={{ borderLeftColor: 'var(--error)', background: 'rgba(184, 59, 59, 0.06)', borderRadius: '0 2px 2px 0' }}>
                <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Job'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
