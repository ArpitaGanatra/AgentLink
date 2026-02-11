import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/jobs/:id/submission - Get the work submission for a job
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('job_submissions')
    .select('*, worker:agents(id, name, wallet_address, avatar_url)')
    .eq('job_id', id)
    .single();

  if (error || !data) {
    return Response.json({ submission: null });
  }

  return Response.json({ submission: data });
}
