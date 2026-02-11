import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateRequest, errorResponse } from '@/lib/auth';
import { JOB_STATUS } from '@/types/database';
import { sendWebhook } from '@/lib/webhooks';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/jobs/:id - Get job details with applications
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const { data: job, error } = await supabaseAdmin
    .from('jobs')
    .select(`
      *,
      requester:agents!jobs_requester_id_fkey(id, wallet_address, name, avatar_url, capabilities),
      worker:agents!jobs_worker_id_fkey(id, wallet_address, name, avatar_url, capabilities),
      applications(
        id,
        pitch,
        created_at,
        agent:agents(id, wallet_address, name, avatar_url, capabilities)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !job) {
    return errorResponse('Job not found', 404);
  }

  return Response.json({ job });
}

// PATCH /api/jobs/:id - Update job (hire, complete, approve, etc.)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Authenticate the request
  const { error: authError, agent } = await authenticateRequest(request);
  if (authError || !agent) {
    return errorResponse(authError || 'Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const { action, worker_id } = body;

    // Get the job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*, requester:agents!jobs_requester_id_fkey(*), worker:agents!jobs_worker_id_fkey(*)')
      .eq('id', id)
      .single();

    if (jobError || !job) {
      return errorResponse('Job not found', 404);
    }

    switch (action) {
      case 'hire': {
        // Only requester can hire
        if (job.requester_id !== agent.id) {
          return errorResponse('Only the requester can hire', 403);
        }
        if (job.status !== JOB_STATUS.OPEN) {
          return errorResponse('Job is not open for hiring', 400);
        }
        if (!worker_id) {
          return errorResponse('worker_id is required', 400);
        }

        // Verify worker exists and applied
        const { data: application } = await supabaseAdmin
          .from('applications')
          .select('*')
          .eq('job_id', id)
          .eq('agent_id', worker_id)
          .single();

        if (!application) {
          return errorResponse('Worker has not applied for this job', 400);
        }

        const { data: updatedJob, error } = await supabaseAdmin
          .from('jobs')
          .update({
            status: JOB_STATUS.IN_PROGRESS,
            worker_id,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return errorResponse('Failed to hire worker', 500);
        }

        // Send webhook to worker
        await sendWebhook(worker_id, 'job.hired', {
          job_id: job.id,
          job_title: job.title,
          payment_sol: job.payment_sol,
        });

        return Response.json({ job: updatedJob, message: 'Worker hired successfully' });
      }

      case 'complete': {
        // Only worker can mark complete
        if (job.worker_id !== agent.id) {
          return errorResponse('Only the assigned worker can complete', 403);
        }
        if (job.status !== JOB_STATUS.IN_PROGRESS) {
          return errorResponse('Job is not in progress', 400);
        }

        const { data: updatedJob, error } = await supabaseAdmin
          .from('jobs')
          .update({ status: JOB_STATUS.PENDING_APPROVAL })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return errorResponse('Failed to mark job complete', 500);
        }

        // Send webhook to requester
        await sendWebhook(job.requester_id, 'job.completed', {
          job_id: job.id,
          job_title: job.title,
          worker_id: agent.id,
        });

        return Response.json({ job: updatedJob, message: 'Job marked as complete, awaiting approval' });
      }

      case 'approve': {
        // Only requester can approve
        if (job.requester_id !== agent.id) {
          return errorResponse('Only the requester can approve', 403);
        }
        if (job.status !== JOB_STATUS.PENDING_APPROVAL) {
          return errorResponse('Job is not pending approval', 400);
        }

        const { data: updatedJob, error } = await supabaseAdmin
          .from('jobs')
          .update({ status: JOB_STATUS.COMPLETED })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return errorResponse('Failed to approve job', 500);
        }

        // Send webhook to worker
        if (job.worker_id) {
          await sendWebhook(job.worker_id, 'job.approved', {
            job_id: job.id,
            job_title: job.title,
            payment_sol: job.payment_sol,
          });
        }

        return Response.json({ job: updatedJob, message: 'Job approved, payment released on-chain' });
      }

      case 'dispute': {
        // Either party can dispute
        if (job.requester_id !== agent.id && job.worker_id !== agent.id) {
          return errorResponse('Only requester or worker can dispute', 403);
        }
        if (job.status !== JOB_STATUS.IN_PROGRESS && job.status !== JOB_STATUS.PENDING_APPROVAL) {
          return errorResponse('Cannot dispute job in current status', 400);
        }

        const { data: updatedJob, error } = await supabaseAdmin
          .from('jobs')
          .update({ status: JOB_STATUS.DISPUTED })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return errorResponse('Failed to dispute job', 500);
        }

        // Send webhook to both parties
        const otherPartyId = job.requester_id === agent.id ? job.worker_id : job.requester_id;
        if (otherPartyId) {
          await sendWebhook(otherPartyId, 'job.disputed', {
            job_id: job.id,
            job_title: job.title,
            disputed_by: agent.id,
          });
        }

        return Response.json({ job: updatedJob, message: 'Job disputed, funds held pending resolution' });
      }

      case 'cancel': {
        // Only requester can cancel
        if (job.requester_id !== agent.id) {
          return errorResponse('Only the requester can cancel', 403);
        }
        if (job.status !== JOB_STATUS.OPEN) {
          return errorResponse('Can only cancel open jobs', 400);
        }

        const { data: updatedJob, error } = await supabaseAdmin
          .from('jobs')
          .update({ status: JOB_STATUS.CANCELLED })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return errorResponse('Failed to cancel job', 500);
        }

        return Response.json({ job: updatedJob, message: 'Job cancelled, escrow refunded on-chain' });
      }

      default:
        return errorResponse('Invalid action. Use: hire, complete, approve, dispute, or cancel');
    }
  } catch (e) {
    console.error('Error updating job:', e);
    return errorResponse('Invalid request body');
  }
}
