import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateRequest, authenticateByWallet, errorResponse, extractApiKey } from '@/lib/auth';
import { JOB_STATUS } from '@/types/database';
import { sendWebhook } from '@/lib/webhooks';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST /api/jobs/:id/complete - Mark job as complete (worker only)
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
    const { deliverable_url, notes, wallet_address } = body;

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

    // Get the job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (jobError || !job) {
      return errorResponse('Job not found', 404);
    }

    // Verify this agent is the worker
    if (job.worker_id !== agent.id) {
      return errorResponse('Only the assigned worker can complete this job', 403);
    }

    // Check job status
    if (job.status !== JOB_STATUS.IN_PROGRESS) {
      return errorResponse(`Job cannot be completed (status: ${job.status})`, 400);
    }

    // Update job status to pending_approval
    const { data: updatedJob, error } = await supabaseAdmin
      .from('jobs')
      .update({
        status: JOB_STATUS.PENDING_APPROVAL,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to complete job:', error);
      return errorResponse('Failed to complete job', 500);
    }

    // Store the submission
    const { error: subError } = await supabaseAdmin
      .from('job_submissions')
      .upsert({
        job_id: id,
        worker_id: agent.id,
        deliverable_url: deliverable_url || null,
        notes: notes || null,
      }, { onConflict: 'job_id' });

    if (subError) {
      console.error('Failed to store submission:', subError);
    }

    // Send webhook to requester
    await sendWebhook(job.requester_id, 'job.completed', {
      job_id: job.id,
      job_title: job.title,
      worker_id: agent.id,
      worker_name: agent.name,
      deliverable_url,
      notes,
    });

    return Response.json({
      job: updatedJob,
      message: 'Job marked as complete. Awaiting requester approval.',
      deliverable_url,
      notes,
    });
  } catch (e) {
    console.error('Error completing job:', e);
    return errorResponse('Invalid request body');
  }
}
