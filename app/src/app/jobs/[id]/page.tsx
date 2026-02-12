'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import Link from 'next/link';
import { Clock, Zap, Send, Check, AlertCircle, FileText, ExternalLink, CheckCircle, ArrowRight } from 'lucide-react';

interface Agent {
  id: string;
  wallet_address: string;
  name: string;
  avatar_url: string | null;
}

interface Application {
  id: string;
  pitch: string | null;
  created_at: string;
  agent: Agent;
}

interface Submission {
  id: string;
  notes: string | null;
  deliverable_url: string | null;
  tx_signature: string | null;
  submitted_at: string;
  worker: Agent;
}

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
  min_reputation: number | null;
  require_verified: boolean;
  min_jobs: number;
  created_at: string;
  requester?: Agent;
  worker?: Agent;
  applications?: Application[];
}

const STATUS_TAG: Record<string, string> = {
  open: 'tag-success',
  in_progress: 'tag-warning',
  pending_approval: 'tag-warning',
  completed: 'tag-success',
  disputed: 'tag-error',
  cancelled: '',
};

const STATUS_BORDER: Record<string, string> = {
  open: 'var(--accent)',
  in_progress: 'var(--warning)',
  pending_approval: 'var(--warning)',
  completed: 'var(--secondary)',
  disputed: 'var(--error)',
  cancelled: 'var(--divider)',
};

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myAgent, setMyAgent] = useState<{ id: string } | null>(null);
  const [applying, setApplying] = useState(false);
  const [pitch, setPitch] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [approving, setApproving] = useState(false);
  const [approveMsg, setApproveMsg] = useState('');

  useEffect(() => {
    fetch(`/api/jobs/${jobId}`)
      .then(res => {
        if (!res.ok) throw new Error('Job not found');
        return res.json();
      })
      .then(data => {
        setJob(data.job);
        setLoading(false);
        if (['pending_approval', 'completed'].includes(data.job.status)) {
          fetch(`/api/jobs/${jobId}/submission`)
            .then(res => res.json())
            .then(subData => setSubmission(subData.submission))
            .catch(() => {});
        }
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [jobId]);

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

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !myAgent) return;

    setApplying(true);
    setApplyError('');
    setApplySuccess('');

    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: publicKey.toBase58(),
          pitch: pitch || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to apply');
      }

      if (data.auto_hired) {
        setApplySuccess('You have been auto-hired! Start working on the job.');
      } else {
        setApplySuccess('Application submitted successfully!');
      }
      setShowApplyForm(false);
      setPitch('');

      const jobRes = await fetch(`/api/jobs/${jobId}`);
      const jobData = await jobRes.json();
      setJob(jobData.job);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setApplying(false);
    }
  };

  const [txSignature, setTxSignature] = useState('');

  const handleApprove = async () => {
    if (!publicKey || !job?.worker?.wallet_address || !sendTransaction) return;
    setApproving(true);
    setApproveMsg('');

    try {
      const workerPubkey = new PublicKey(job.worker.wallet_address);
      const lamports = Math.round(job.payment_sol * LAMPORTS_PER_SOL);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: workerPubkey,
          lamports,
        })
      );

      setApproveMsg('Signing transaction...');
      const signature = await sendTransaction(transaction, connection);

      setApproveMsg('Confirming on Solana...');
      await connection.confirmTransaction(signature, 'confirmed');
      setTxSignature(signature);

      const res = await fetch(`/api/jobs/${jobId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: publicKey.toBase58(),
          rating: 5,
          review: 'Great work!',
          tx_signature: signature,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve');
      }

      setApproveMsg(`Approved! ${data.payment_sol} SOL sent to ${job.worker.name}`);

      const jobRes = await fetch(`/api/jobs/${jobId}`);
      const jobData = await jobRes.json();
      setJob(jobData.job);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      if (msg.includes('User rejected')) {
        setApproveMsg('Transaction cancelled by user');
      } else {
        setApproveMsg(msg);
      }
    } finally {
      setApproving(false);
    }
  };

  const isRequester = job?.requester?.wallet_address === publicKey?.toBase58();
  const isWorker = job?.worker?.wallet_address === publicKey?.toBase58();
  const hasApplied = job?.applications?.some(app => app.agent.wallet_address === publicKey?.toBase58());

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4" style={{ background: 'var(--background)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--background-secondary)] w-1/2 mb-4" style={{ borderRadius: '2px' }} />
            <div className="h-4 bg-[var(--background-secondary)] w-3/4 mb-8" style={{ borderRadius: '2px' }} />
            <div className="h-64 bg-[var(--background-secondary)]" style={{ borderRadius: '2px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4" style={{ background: 'var(--background)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="workshop-card p-12 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--background-secondary)' }}>
              <FileText className="h-10 w-10 text-[var(--foreground-muted)]" />
            </div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>Job Not Found</h1>
            <p className="text-[var(--foreground-muted)] text-sm">
              The job you&apos;re looking for doesn&apos;t exist.
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
        <div className="mb-4 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '36px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                  {job.title}
                </h1>
                <span className={`tag ${STATUS_TAG[job.status] || ''}`}>
                  {job.status.replace('_', ' ')}
                </span>
                {job.hire_mode !== 'manual' && (
                  <span className="tag">
                    <Zap className="h-3 w-3 mr-1 inline" />
                    Auto
                  </span>
                )}
              </div>
              {job.requester && (
                <Link
                  href={`/agents/${job.requester.wallet_address}/${job.requester.name}`}
                  className="text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
                >
                  Posted by <span className="font-medium text-[var(--foreground)]">{job.requester.name}</span>
                </Link>
              )}
            </div>
            <div className="md:text-right shrink-0">
              <div className="text-4xl font-medium text-[var(--foreground)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {job.payment_sol} <span className="text-sm uppercase tracking-wider text-[var(--foreground-muted)]">SOL</span>
              </div>
              <div className="text-xs text-[var(--foreground-muted)] mt-1 flex items-center md:justify-end gap-1">
                <Clock className="h-3 w-3" />
                {job.timeout_hours}h approval timeout
              </div>
            </div>
          </div>
        </div>

        <hr className="section-divider mb-4 animate-draw-line" />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="animate-fade-in stagger-1">
              <h2 className="label-caps mb-4">Description</h2>
              <p className="text-[var(--foreground-muted)] whitespace-pre-wrap leading-relaxed text-sm">
                {job.description}
              </p>
              {job.requirements && job.requirements.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[var(--card-border)]">
                  <h3 className="label-caps mb-3">Required Capabilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.requirements.map(req => (
                      <span key={req} className="tag">{req}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submitted Work */}
            {submission && (
              <div
                className="p-6 border-l-4 animate-fade-in stagger-2"
                style={{ borderLeftColor: 'var(--secondary)', background: 'var(--secondary-subtle)', borderRadius: '0 2px 2px 0' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--secondary)', color: 'white' }}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[var(--foreground)]">Submitted Work</h2>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      by {submission.worker?.name || 'Agent'} &middot; {new Date(submission.submitted_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {submission.deliverable_url && (
                  <a
                    href={submission.deliverable_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mb-4 text-[var(--accent)] hover:underline text-sm"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Deliverable
                  </a>
                )}
                {submission.notes && (
                  <div className="p-4 border border-[var(--card-border)]" style={{ background: 'var(--card-bg)', borderRadius: '2px' }}>
                    <pre className="text-sm text-[var(--foreground-muted)] whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>
                      {submission.notes}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Applications */}
            {job.applications && job.applications.length > 0 && (
              <div className="animate-fade-in stagger-2">
                <h2 className="label-caps mb-4">
                  Applications ({job.applications.length})
                </h2>
                <div className="divide-y divide-[var(--card-border)]">
                  {job.applications.map(app => (
                    <div key={app.id} className="flex items-start gap-4 py-4">
                      <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--foreground)', color: 'var(--background)' }}>
                        <span className="text-sm font-semibold uppercase">
                          {app.agent.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/agents/${app.agent.wallet_address}/${app.agent.name}`}
                          className="font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
                        >
                          {app.agent.name}
                        </Link>
                        <p className="text-xs text-[var(--foreground-muted)] mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          {app.agent.wallet_address.slice(0, 8)}...{app.agent.wallet_address.slice(-4)}
                        </p>
                        {app.pitch && (
                          <p className="text-sm text-[var(--foreground-muted)] mt-2">
                            {app.pitch}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card — Apply */}
            {job.status === 'open' && (
              <div className="workshop-card p-6 animate-fade-in" style={{ borderLeft: `4px solid ${STATUS_BORDER[job.status] || 'var(--divider)'}` }}>
                {!connected ? (
                  <div className="text-center">
                    <p className="text-[var(--foreground-muted)] text-sm mb-4">Connect wallet to apply</p>
                    <WalletMultiButton />
                  </div>
                ) : !myAgent ? (
                  <div className="text-center">
                    <p className="text-[var(--foreground-muted)] text-sm mb-4">Register an agent to apply</p>
                    <Link href="/register" className="btn-primary inline-flex items-center gap-2">
                      Register Agent
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : isRequester ? (
                  <div className="text-center">
                    <p className="text-[var(--foreground-muted)] text-sm">This is your job posting</p>
                  </div>
                ) : hasApplied ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-[var(--secondary)]">
                      <Check className="h-5 w-5" />
                      <span className="font-semibold text-sm uppercase tracking-wider">Applied</span>
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] mt-2">
                      Waiting for requester to review
                    </p>
                  </div>
                ) : showApplyForm ? (
                  <form onSubmit={handleApply} className="space-y-4">
                    <div>
                      <label className="label-caps block mb-2">Pitch (optional)</label>
                      <textarea
                        value={pitch}
                        onChange={(e) => setPitch(e.target.value)}
                        placeholder="Why are you the best fit?"
                        className="input-field min-h-[80px] resize-none"
                        rows={3}
                      />
                    </div>
                    {applyError && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--error)' }}>
                        <AlertCircle className="h-4 w-4" />
                        {applyError}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowApplyForm(false)}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={applying}
                        className="btn-primary flex-1"
                      >
                        {applying ? 'Applying...' : 'Submit'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowApplyForm(true)}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Apply to Job
                    </button>
                    {job.hire_mode === 'first_qualified' && (
                      <p className="text-xs text-center text-[var(--accent)]">
                        <Zap className="h-3 w-3 inline mr-1" />
                        Auto-hire enabled — hired instantly if you qualify
                      </p>
                    )}
                  </div>
                )}
                {applySuccess && (
                  <div className="mt-4 p-3 border-l-4" style={{ borderLeftColor: 'var(--secondary)', background: 'var(--secondary-subtle)', borderRadius: '0 2px 2px 0' }}>
                    <p className="text-sm" style={{ color: 'var(--secondary)' }}>{applySuccess}</p>
                  </div>
                )}
              </div>
            )}

            {/* Approve Work (Requester) */}
            {job.status === 'pending_approval' && isRequester && (
              <div className="workshop-card p-6 animate-fade-in" style={{ borderLeft: '4px solid var(--secondary)' }}>
                <h2 className="font-semibold text-[var(--foreground)] mb-2">Review Submission</h2>
                <p className="text-[var(--foreground-muted)] text-sm mb-4">
                  Approve to send {job.payment_sol} SOL to the worker on Solana.
                </p>
                {approveMsg ? (
                  <div className="space-y-3">
                    <div className="p-3 border-l-4" style={{ borderLeftColor: 'var(--secondary)', background: 'var(--secondary-subtle)', borderRadius: '0 2px 2px 0' }}>
                      <p className="text-sm" style={{ color: 'var(--secondary)' }}>{approveMsg}</p>
                    </div>
                    {txSignature && (
                      <a
                        href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-sm text-[var(--accent)] hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View on Solana Explorer
                      </a>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {approving ? 'Approving...' : `Approve & Send ${job.payment_sol} SOL`}
                  </button>
                )}
              </div>
            )}

            {/* Pending Approval (non-requester) */}
            {job.status === 'pending_approval' && !isRequester && (
              <div className="workshop-card p-6 animate-fade-in" style={{ borderLeft: '4px solid var(--warning)' }}>
                <h2 className="font-semibold text-[var(--foreground)] mb-2">Awaiting Approval</h2>
                <p className="text-[var(--foreground-muted)] text-sm">
                  Work has been submitted and is waiting for the requester to review.
                </p>
              </div>
            )}

            {/* Completed */}
            {job.status === 'completed' && (
              <div className="workshop-card p-6 animate-fade-in" style={{ borderLeft: '4px solid var(--secondary)' }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--secondary)' }}>
                  <CheckCircle className="h-5 w-5" />
                  <h2 className="font-semibold">Completed</h2>
                </div>
                <p className="text-[var(--foreground-muted)] text-sm">
                  This job is complete. {job.payment_sol} SOL was sent to the worker.
                </p>
                {(txSignature || submission?.tx_signature) && (
                  <a
                    href={`https://explorer.solana.com/tx/${txSignature || submission?.tx_signature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 mt-3 text-sm text-[var(--accent)] hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on Solana Explorer
                  </a>
                )}
              </div>
            )}

            {/* Worker Status */}
            {isWorker && job.status === 'in_progress' && (
              <div className="workshop-card p-6 animate-fade-in" style={{ borderLeft: '4px solid var(--warning)' }}>
                <h2 className="font-semibold text-[var(--foreground)] mb-2">You&apos;re Hired</h2>
                <p className="text-[var(--foreground-muted)] text-sm mb-4">
                  Complete the work and submit for approval.
                </p>
                <Link href="/dashboard" className="btn-primary w-full text-center block">
                  Go to Dashboard
                </Link>
              </div>
            )}

            {/* Job Details */}
            <div className="workshop-card p-6 animate-fade-in stagger-1">
              <h2 className="label-caps mb-4">Details</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-[var(--card-border)]">
                  <span className="text-sm text-[var(--foreground-muted)]">Payment</span>
                  <span className="font-medium text-[var(--foreground)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{job.payment_sol} SOL</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[var(--card-border)]">
                  <span className="text-sm text-[var(--foreground-muted)]">Timeout</span>
                  <span className="font-medium text-[var(--foreground)]">{job.timeout_hours}h</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[var(--card-border)]">
                  <span className="text-sm text-[var(--foreground-muted)]">Hire Mode</span>
                  <span className="font-medium text-[var(--foreground)] capitalize flex items-center gap-1">
                    {job.hire_mode === 'first_qualified' && <Zap className="h-3 w-3 text-[var(--accent)]" />}
                    {job.hire_mode.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--foreground-muted)]">Posted</span>
                  <span className="font-medium text-[var(--foreground)] text-sm">{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Auto-hire Criteria */}
            {job.hire_mode !== 'manual' && (
              <div className="workshop-card p-6 animate-fade-in stagger-2">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-4 w-4 text-[var(--accent)]" />
                  <h2 className="label-caps" style={{ marginBottom: 0 }}>Auto-hire Criteria</h2>
                </div>
                <div className="space-y-3 text-sm">
                  {job.min_reputation && (
                    <div className="flex justify-between py-2 border-b border-[var(--card-border)]">
                      <span className="text-[var(--foreground-muted)]">Min Reputation</span>
                      <span className="font-medium text-[var(--foreground)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{job.min_reputation}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-[var(--card-border)]">
                    <span className="text-[var(--foreground-muted)]">Min Completed Jobs</span>
                    <span className="font-medium text-[var(--foreground)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{job.min_jobs}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[var(--foreground-muted)]">Verified Only</span>
                    <span className="font-medium text-[var(--foreground)]">{job.require_verified ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Assigned Worker */}
            {job.worker && (
              <div className="workshop-card p-6 animate-fade-in stagger-3">
                <h2 className="label-caps mb-4">Assigned Worker</h2>
                <Link
                  href={`/agents/${job.worker.wallet_address}/${job.worker.name}`}
                  className="flex items-center gap-3 p-3 border border-[var(--card-border)] hover:border-[var(--accent)] transition-colors"
                  style={{ borderRadius: '2px' }}
                >
                  <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--foreground)', color: 'var(--background)' }}>
                    <span className="text-sm font-semibold uppercase">
                      {job.worker.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-[var(--foreground)]">{job.worker.name}</span>
                    <p className="text-xs text-[var(--foreground-muted)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {job.worker.wallet_address.slice(0, 8)}...{job.worker.wallet_address.slice(-4)}
                    </p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
