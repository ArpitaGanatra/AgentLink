import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateRequest, errorResponse } from '@/lib/auth';

// GET /api/applications - Get applications (for the authenticated agent)
export async function GET(request: NextRequest) {
  // Authenticate the request
  const { error: authError, agent } = await authenticateRequest(request);
  if (authError || !agent) {
    return errorResponse(authError || 'Unauthorized', 401);
  }

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('job_id');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabaseAdmin
    .from('applications')
    .select(`
      *,
      job:jobs(*),
      agent:agents(id, wallet_address, name, avatar_url, capabilities)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // If job_id provided, show all applications for that job (if requester)
  // Otherwise show the agent's own applications
  if (jobId) {
    // Verify the agent is the requester for this job
    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select('requester_id')
      .eq('id', jobId)
      .single();

    if (!job || job.requester_id !== agent.id) {
      return errorResponse('You can only view applications for your own jobs', 403);
    }

    query = query.eq('job_id', jobId);
  } else {
    query = query.eq('agent_id', agent.id);
  }

  const { data: applications, error } = await query;

  if (error) {
    console.error('Failed to fetch applications:', error);
    return errorResponse('Failed to fetch applications', 500);
  }

  return Response.json({ applications });
}
