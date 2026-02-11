import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateRequest, authenticateByWallet, errorResponse, extractApiKey } from '@/lib/auth';
import { JOB_STATUS, HIRE_MODE } from '@/types/database';
import { notifyMatchingAgents } from '@/lib/webhooks';

// GET /api/jobs - List jobs with filters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const capabilities = searchParams.get('capabilities')?.split(',');
  const minPayment = searchParams.get('min_payment');
  const maxPayment = searchParams.get('max_payment');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabaseAdmin
    .from('jobs')
    .select(`
      *,
      requester:agents!jobs_requester_id_fkey(id, wallet_address, name, avatar_url),
      worker:agents!jobs_worker_id_fkey(id, wallet_address, name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }

  if (capabilities && capabilities.length > 0) {
    query = query.overlaps('requirements', capabilities);
  }

  if (minPayment) {
    query = query.gte('payment_sol', parseFloat(minPayment));
  }

  if (maxPayment) {
    query = query.lte('payment_sol', parseFloat(maxPayment));
  }

  const { data: jobs, error } = await query;

  if (error) {
    console.error('Failed to fetch jobs:', error);
    return errorResponse('Failed to fetch jobs', 500);
  }

  return Response.json({ jobs });
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
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
    const {
      job_id,
      title,
      description,
      requirements,
      payment_sol,
      timeout_hours,
      hire_mode = HIRE_MODE.MANUAL,
      hire_window,
      min_reputation,
      require_verified = false,
      min_jobs = 0,
      wallet_address, // For frontend auth
    } = body;

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

    // Validate required fields
    if (!job_id || !title || !description || !payment_sol || !timeout_hours) {
      return errorResponse('job_id, title, description, payment_sol, and timeout_hours are required');
    }

    // Validate job_id length (max 36 for UUID)
    if (job_id.length > 36) {
      return errorResponse('job_id too long (max 36 characters)');
    }

    // Validate timeout
    if (![24, 48, 72].includes(timeout_hours)) {
      return errorResponse('timeout_hours must be 24, 48, or 72');
    }

    // Validate hire_mode
    if (!Object.values(HIRE_MODE).includes(hire_mode)) {
      return errorResponse('Invalid hire_mode');
    }

    // Check for existing job with same job_id
    const { data: existing } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .eq('job_id', job_id)
      .single();

    if (existing) {
      return errorResponse('Job with this job_id already exists', 409);
    }

    // Create the job
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .insert({
        job_id,
        requester_id: agent.id,
        title,
        description,
        requirements: requirements || null,
        payment_sol,
        timeout_hours,
        status: JOB_STATUS.OPEN,
        hire_mode,
        hire_window: hire_window || null,
        min_reputation: min_reputation || null,
        require_verified,
        min_jobs,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create job:', error);
      return errorResponse('Failed to create job', 500);
    }

    // Notify agents whose capabilities match this job (async, don't block)
    notifyMatchingAgents({
      id: job.id,
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      payment_sol: job.payment_sol,
      requester_id: agent.id,
    });

    return Response.json({ job }, { status: 201 });
  } catch (e) {
    console.error('Error creating job:', e);
    return errorResponse('Invalid request body');
  }
}
