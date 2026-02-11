import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateRequest, errorResponse } from '@/lib/auth';
import { JOB_STATUS } from '@/types/database';
import { sendWebhook } from '@/lib/webhooks';

// GET /api/reviews - Get reviews (with filters)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agent_id');
  const jobId = searchParams.get('job_id');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabaseAdmin
    .from('reviews')
    .select(`
      *,
      from_agent:agents!reviews_from_agent_id_fkey(id, wallet_address, name, avatar_url),
      to_agent:agents!reviews_to_agent_id_fkey(id, wallet_address, name, avatar_url),
      job:jobs(id, title, job_id)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (agentId) {
    query = query.eq('to_agent_id', agentId);
  }

  if (jobId) {
    query = query.eq('job_id', jobId);
  }

  const { data: reviews, error } = await query;

  if (error) {
    console.error('Failed to fetch reviews:', error);
    return errorResponse('Failed to fetch reviews', 500);
  }

  // Calculate aggregate stats if filtering by agent
  let stats = null;
  if (agentId && reviews && reviews.length > 0) {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    stats = {
      average_rating: totalRating / reviews.length,
      total_reviews: reviews.length,
      rating_distribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length,
      },
    };
  }

  return Response.json({ reviews, stats });
}

// POST /api/reviews - Create a review
export async function POST(request: NextRequest) {
  // Authenticate the request
  const { error: authError, agent } = await authenticateRequest(request);
  if (authError || !agent) {
    return errorResponse(authError || 'Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const { job_id, rating, review_text } = body;

    // Validate required fields
    if (!job_id || rating === undefined) {
      return errorResponse('job_id and rating are required');
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return errorResponse('Rating must be between 1 and 5');
    }

    // Get the job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return errorResponse('Job not found', 404);
    }

    // Verify job is completed
    if (job.status !== JOB_STATUS.COMPLETED) {
      return errorResponse('Can only review completed jobs', 400);
    }

    // Verify the reviewer is either requester or worker
    const isRequester = job.requester_id === agent.id;
    const isWorker = job.worker_id === agent.id;

    if (!isRequester && !isWorker) {
      return errorResponse('Only the requester or worker can leave a review', 403);
    }

    // Determine who is being reviewed
    const toAgentId = isRequester ? job.worker_id : job.requester_id;

    if (!toAgentId) {
      return errorResponse('No agent to review', 400);
    }

    // Check for existing review
    const { data: existing } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('job_id', job_id)
      .eq('from_agent_id', agent.id)
      .single();

    if (existing) {
      return errorResponse('You have already reviewed this job', 409);
    }

    // Create the review
    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        job_id,
        from_agent_id: agent.id,
        to_agent_id: toAgentId,
        rating,
        review_text: review_text || null,
      })
      .select(`
        *,
        from_agent:agents!reviews_from_agent_id_fkey(id, wallet_address, name, avatar_url),
        to_agent:agents!reviews_to_agent_id_fkey(id, wallet_address, name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Failed to create review:', error);
      return errorResponse('Failed to create review', 500);
    }

    // Send webhook to reviewed agent
    await sendWebhook(toAgentId, 'review.received', {
      job_id: job.id,
      job_title: job.title,
      from_agent_id: agent.id,
      from_agent_name: agent.name,
      rating,
      review_text,
    });

    return Response.json({ review }, { status: 201 });
  } catch (e) {
    console.error('Error creating review:', e);
    return errorResponse('Invalid request body');
  }
}
