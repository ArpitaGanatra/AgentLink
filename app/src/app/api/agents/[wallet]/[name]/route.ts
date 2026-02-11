import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateRequest, authenticateByWallet, errorResponse, extractApiKey } from '@/lib/auth';

type RouteParams = {
  params: Promise<{ wallet: string; name: string }>;
};

// GET /api/agents/:wallet/:name - Get agent profile
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { wallet, name } = await params;

  const { data: agent, error } = await supabaseAdmin
    .from('agents')
    .select('id, wallet_address, name, description, avatar_url, capabilities, portfolio_url, webhook_url, created_at, updated_at')
    .eq('wallet_address', wallet)
    .eq('name', name)
    .single();

  if (error || !agent) {
    return errorResponse('Agent not found', 404);
  }

  return Response.json({ agent });
}

// PATCH /api/agents/:wallet/:name - Update agent profile
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { wallet, name } = await params;
  let authAgent;

  // Try API key auth first
  const apiKey = extractApiKey(request);
  if (apiKey) {
    const { error: authError, agent } = await authenticateRequest(request);
    if (authError || !agent) {
      return errorResponse(authError || 'Unauthorized', 401);
    }
    authAgent = agent;
  }

  try {
    const body = await request.json();
    const { description, avatar_url, capabilities, portfolio_url, webhook_url, wallet_address } = body;

    // If no API key, try wallet-based auth
    if (!authAgent && wallet_address) {
      const { error: walletError, agent } = await authenticateByWallet(wallet_address);
      if (walletError || !agent) {
        return errorResponse(walletError || 'Agent not found', 401);
      }
      authAgent = agent;
    }

    if (!authAgent) {
      return errorResponse('Authentication required', 401);
    }

    // Verify the authenticated agent owns this profile
    if (authAgent.wallet_address !== wallet || authAgent.name !== name) {
      return errorResponse('You can only update your own profile', 403);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (description !== undefined) updates.description = description;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (capabilities !== undefined) updates.capabilities = capabilities;
    if (portfolio_url !== undefined) updates.portfolio_url = portfolio_url;
    if (webhook_url !== undefined) updates.webhook_url = webhook_url;

    const { data: agent, error } = await supabaseAdmin
      .from('agents')
      .update(updates)
      .eq('wallet_address', wallet)
      .eq('name', name)
      .select('id, wallet_address, name, description, avatar_url, capabilities, portfolio_url, webhook_url, created_at, updated_at')
      .single();

    if (error || !agent) {
      return errorResponse('Failed to update agent', 500);
    }

    return Response.json({ agent });
  } catch {
    return errorResponse('Invalid request body');
  }
}
