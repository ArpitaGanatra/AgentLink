import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateRequest, authenticateByWallet, errorResponse, extractApiKey } from '@/lib/auth';
import { JOB_STATUS } from '@/types/database';
import { sendWebhook } from '@/lib/webhooks';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST /api/jobs/:id/approve - Approve completed job (requester only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let agent;

  // Try API key auth first
  const apiKey = extractApiKey(request);
  if (apiKey) {
    const { error: authError, agent: authAgent } = await authenticateRequest(request);
    if (authError || !authAgent) {
      return errorResponse(authError || 'Unauthorized', 401);
    }
    agent = authAgent;
  }

  try {
    const body = await request.json();
    const { rating, review, wallet_address, tx_signature } = body;

    // If no API key, try wallet-based auth
    if (!agent && wallet_address) {
      const { error: walletError, agent: walletAgent } = await authenticateByWallet(wallet_address);
      if (walletError || !walletAgent) {
        return errorResponse(walletError || 'Agent not found', 401);
      }
      agent = walletAgent;
    }

    if (!agent) {
      return errorResponse('Authentication required', 401);
    }

    // Get the job with worker info
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*, worker:agents!jobs_worker_id_fkey(id, name, wallet_address)')
      .eq('id', id)
      .single();

    if (jobError || !job) {
      return errorResponse('Job not found', 404);
    }

    // Verify this agent is the requester
    if (job.requester_id !== agent.id) {
      return errorResponse('Only the job requester can approve this job', 403);
    }

    // Check job status
    if (job.status !== JOB_STATUS.PENDING_APPROVAL) {
      return errorResponse(`Job cannot be approved (status: ${job.status})`, 400);
    }

    // Update job status
    const { data: updatedJob, error } = await supabaseAdmin
      .from('jobs')
      .update({
        status: JOB_STATUS.COMPLETED,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to approve job:', error);
      return errorResponse('Failed to approve job', 500);
    }

    // Create review if provided
    if (rating) {
      await supabaseAdmin
        .from('reviews')
        .insert({
          job_id: id,
          from_agent_id: agent.id,
          to_agent_id: job.worker_id,
          rating: Math.min(5, Math.max(1, rating)),
          review_text: review || null,
        });

      // Check if worker should be verified (3 successful jobs)
      const { count } = await supabaseAdmin
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('worker_id', job.worker_id)
        .eq('status', JOB_STATUS.COMPLETED);

      if (count && count >= 3) {
        // Update worker's verified status in agents table
        await supabaseAdmin
          .from('agents')
          .update({ verified: true })
          .eq('id', job.worker_id);
      }
    }

    // Store tx signature in submission if provided
    if (tx_signature) {
      await supabaseAdmin
        .from('job_submissions')
        .update({ tx_signature })
        .eq('job_id', id);
    }

    // Send webhook to worker
    await sendWebhook(job.worker_id, 'job.approved', {
      job_id: job.id,
      job_title: job.title,
      payment_sol: job.payment_sol,
      tx_signature,
      rating,
      review,
    });

    return Response.json({
      job: updatedJob,
      message: 'Job approved! Payment released.',
      payment_sol: job.payment_sol,
      tx_signature,
    });
  } catch (e) {
    console.error('Error approving job:', e);
    return errorResponse('Invalid request body');
  }
}
