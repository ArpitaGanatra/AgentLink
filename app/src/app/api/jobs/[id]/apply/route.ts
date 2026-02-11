import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateRequest, authenticateByWallet, errorResponse, extractApiKey } from '@/lib/auth';
import { JOB_STATUS, HIRE_MODE } from '@/types/database';
import { sendWebhook } from '@/lib/webhooks';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// Helper to check if agent meets auto-hire criteria
async function meetsHireCriteria(
  agentId: string,
  job: {
    min_reputation: number | null;
    require_verified: boolean;
    min_jobs: number;
  }
): Promise<boolean> {
  // For MVP, we'll check based on database stats
  // In production, this would fetch on-chain data from the agent PDA

  // Get agent's review stats
  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('to_agent_id', agentId);

  const avgRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // Get completed jobs count
  const { count: completedJobs } = await supabaseAdmin
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('worker_id', agentId)
    .eq('status', JOB_STATUS.COMPLETED);

  // Calculate reputation score (simplified version of on-chain formula)
  const reputationScore = Math.min(10000,
    ((completedJobs || 0) * 500) + (avgRating * 100)
  );

  // Check criteria
  if (job.min_reputation !== null && reputationScore < job.min_reputation) {
    return false;
  }

  if (job.require_verified && (completedJobs || 0) < 3) {
    return false;
  }

  if (job.min_jobs > 0 && (completedJobs || 0) < job.min_jobs) {
    return false;
  }

  return true;
}

// POST /api/jobs/:id/apply - Apply to a job
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let agent;

  // Try API key auth first (for SDK/autonomous agents)
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
    const { pitch, wallet_address } = body;

    // If no API key, try wallet-based auth (for frontend)
    if (!agent && wallet_address) {
      const { error: walletError, agent: walletAgent } = await authenticateByWallet(wallet_address);
      if (walletError || !walletAgent) {
        return errorResponse(walletError || 'Agent not found', 401);
      }
      agent = walletAgent;
    }

    if (!agent) {
      return errorResponse('Authentication required (API key or wallet_address)', 401);
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

    // Check job is open
    if (job.status !== JOB_STATUS.OPEN) {
      return errorResponse('Job is not open for applications', 400);
    }

    // Check agent is not the requester
    if (job.requester_id === agent.id) {
      return errorResponse('Cannot apply to your own job', 400);
    }

    // Check for existing application
    const { data: existing } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('job_id', id)
      .eq('agent_id', agent.id)
      .single();

    if (existing) {
      return errorResponse('You have already applied to this job', 409);
    }

    // Create the application
    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .insert({
        job_id: id,
        agent_id: agent.id,
        pitch: pitch || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create application:', error);
      return errorResponse('Failed to apply', 500);
    }

    // Send webhook to requester
    await sendWebhook(job.requester_id, 'job.application_received', {
      job_id: job.id,
      job_title: job.title,
      applicant_id: agent.id,
      applicant_name: agent.name,
      pitch,
    });

    // Handle auto-hire for first_qualified mode
    if (job.hire_mode === HIRE_MODE.FIRST_QUALIFIED) {
      const meetsCriteria = await meetsHireCriteria(agent.id, job);

      if (meetsCriteria) {
        // Auto-hire this agent
        const { data: updatedJob } = await supabaseAdmin
          .from('jobs')
          .update({
            status: JOB_STATUS.IN_PROGRESS,
            worker_id: agent.id,
          })
          .eq('id', id)
          .select()
          .single();

        // Send hire notification
        await sendWebhook(agent.id, 'job.hired', {
          job_id: job.id,
          job_title: job.title,
          payment_sol: job.payment_sol,
          auto_hired: true,
        });

        return Response.json({
          application,
          auto_hired: true,
          job: updatedJob,
          message: 'Application submitted and auto-hired! You meet the job criteria.',
        }, { status: 201 });
      }
    }

    return Response.json({
      application,
      auto_hired: false,
      message: 'Application submitted successfully',
    }, { status: 201 });
  } catch (e) {
    console.error('Error applying to job:', e);
    return errorResponse('Invalid request body');
  }
}
