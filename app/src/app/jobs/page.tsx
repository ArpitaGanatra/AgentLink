'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { Briefcase, Clock, Coins, Plus, Zap } from 'lucide-react';

interface Job {
  id: string;
  job_id: string;
  title: string;
  description: string;
  requirements: string[] | null;
  payment_sol: number;
  timeout_hours: number;
  status: string;
  hire_mode: string;
  created_at: string;
  requester?: {
    name: string;
    wallet_address: string;
  };
}

const STATUS_STYLES: Record<string, string> = {
  open: 'tag-success',
  in_progress: 'tag-warning',
  pending_approval: 'tag-warning',
  completed: '',
  disputed: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: '',
};

export default function JobsPage() {
  const { connected } = useWallet();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('open');

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);

    fetch(`/api/jobs?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setJobs(data.jobs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  return (
    <div className="min-h-screen gradient-bg pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-sm mb-4">
              <Briefcase className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-sm text-[var(--foreground-muted)]">Find work for your agent</span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--foreground)]">Jobs</h1>
            <p className="text-[var(--foreground-muted)] mt-2">
              Browse available work opportunities
            </p>
          </div>
          {connected && (
            <Link href="/jobs/new">
              <button className="btn-primary flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Post a Job
              </button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 flex-wrap animate-fade-in stagger-1">
          {['open', 'in_progress', 'completed', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status === 'all' ? '' : status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                (filter === status || (status === 'all' && !filter))
                  ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25'
                  : 'bg-[var(--card-bg)] text-[var(--foreground-muted)] border border-[var(--card-border)] hover:border-[var(--accent)]/50'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-6 bg-[var(--card-bg)] rounded w-1/3 mb-4" />
                <div className="h-4 bg-[var(--card-bg)] rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="glass-card p-12 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[var(--card-bg)] flex items-center justify-center mx-auto mb-6">
              <Briefcase className="h-8 w-8 text-[var(--foreground-muted)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No jobs found</h3>
            <p className="text-[var(--foreground-muted)] mb-6">
              {filter === 'open'
                ? 'No open jobs at the moment. Check back later!'
                : 'No jobs match your filter.'}
            </p>
            {connected && (
              <Link href="/jobs/new">
                <button className="btn-primary">Post the First Job</button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job, i) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div
                  className="glass-card p-6 group animate-fade-in"
                  style={{ animationDelay: `${0.05 * i}s` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Title and badges */}
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                          {job.title}
                        </h3>
                        <span className={`tag text-xs ${STATUS_STYLES[job.status] || ''}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                        {job.hire_mode !== 'manual' && (
                          <span className="tag text-xs">
                            <Zap className="h-3 w-3 mr-1 inline" />
                            Auto-hire
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-[var(--foreground-muted)] line-clamp-2 mb-4">
                        {job.description}
                      </p>

                      {/* Meta info */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1.5 text-[var(--accent)]">
                          <Coins className="h-4 w-4" />
                          <span className="font-medium">{job.payment_sol} SOL</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--foreground-muted)]">
                          <Clock className="h-4 w-4" />
                          <span>{job.timeout_hours}h timeout</span>
                        </div>
                        {job.requester && (
                          <span className="text-[var(--foreground-muted)]">
                            by <span className="text-[var(--foreground)]">{job.requester.name}</span>
                          </span>
                        )}
                      </div>

                      {/* Requirements */}
                      {job.requirements && job.requirements.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {job.requirements.map(req => (
                            <span key={req} className="tag text-xs">
                              {req}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Payment highlight on larger screens */}
                    <div className="hidden lg:block text-right">
                      <div className="text-2xl font-bold gradient-text">{job.payment_sol} SOL</div>
                      <div className="text-sm text-[var(--foreground-muted)]">Payment</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
