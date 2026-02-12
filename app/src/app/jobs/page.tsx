'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { Clock, Plus, Zap } from 'lucide-react';

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

const STATUS_BORDER: Record<string, string> = {
  open: 'border-l-[var(--accent)]',
  in_progress: 'border-l-[var(--warning)]',
  pending_approval: 'border-l-[var(--warning)]',
  completed: 'border-l-[var(--secondary)]',
  disputed: 'border-l-[var(--error)]',
  cancelled: 'border-l-[var(--divider)]',
};

const STATUS_TAG: Record<string, string> = {
  open: 'tag-success',
  in_progress: 'tag-warning',
  pending_approval: 'tag-warning',
  completed: 'tag-success',
  disputed: 'tag-error',
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
    <div className="min-h-screen pt-24 pb-12 px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-4 animate-fade-in">
          <div>
            <h1 className="mb-2" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '42px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Jobs
            </h1>
            <p className="text-[var(--foreground-muted)] text-sm">
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

        <hr className="section-divider mb-4 animate-draw-line" />

        {/* Filters */}
        <div className="flex gap-2 mb-8 flex-wrap animate-fade-in stagger-1">
          {['open', 'in_progress', 'completed', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status === 'all' ? '' : status)}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-all cursor-pointer ${
                (filter === status || (status === 'all' && !filter))
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-transparent text-[var(--foreground-muted)] border-2 border-[var(--card-border)] hover:border-[var(--foreground)]'
              }`}
              style={{ borderRadius: '2px' }}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-0">
            {[1, 2, 3].map(i => (
              <div key={i} className="py-6 border-b border-[var(--card-border)] animate-pulse">
                <div className="h-5 bg-[var(--background-secondary)] w-1/3 mb-3" style={{ borderRadius: '2px' }} />
                <div className="h-4 bg-[var(--background-secondary)] w-2/3" style={{ borderRadius: '2px' }} />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="workshop-card p-12 text-center animate-fade-in">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No jobs found</h3>
            <p className="text-[var(--foreground-muted)] text-sm mb-6">
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
          <div>
            {jobs.map((job, i) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div
                  className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-6 border-l-4 pl-6 border-b border-[var(--card-border)] hover:bg-[var(--card-bg)] transition-colors cursor-pointer animate-fade-in group ${STATUS_BORDER[job.status] || 'border-l-[var(--divider)]'}`}
                  style={{ animationDelay: `${0.03 * i}s` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1.5">
                      <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                        {job.title}
                      </h3>
                      <span className={`tag text-xs ${STATUS_TAG[job.status] || ''}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                      {job.hire_mode !== 'manual' && (
                        <span className="tag text-xs">
                          <Zap className="h-3 w-3 mr-1 inline" />
                          Auto
                        </span>
                      )}
                    </div>

                    <p className="text-[var(--foreground-muted)] text-sm line-clamp-1 mb-2">
                      {job.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-[var(--foreground-muted)]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {job.timeout_hours}h
                      </span>
                      {job.requester && (
                        <span>by <span className="text-[var(--foreground)]">{job.requester.name}</span></span>
                      )}
                      {job.requirements && job.requirements.length > 0 && (
                        <span>{job.requirements.join(', ')}</span>
                      )}
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="lg:text-right shrink-0">
                    <div className="text-xl font-medium text-[var(--foreground)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {job.payment_sol} <span className="text-xs uppercase tracking-wider text-[var(--foreground-muted)]">SOL</span>
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
