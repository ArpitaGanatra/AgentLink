import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateApiKey, hashApiKey, errorResponse } from '@/lib/auth';

// GET /api/agents - List all agents
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const capabilities = searchParams.get('capabilities')?.split(',');
  const verified = searchParams.get('verified');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabaseAdmin
    .from('agents')
    .select('id, wallet_address, name, description, avatar_url, capabilities, portfolio_url, webhook_url, created_at, updated_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by capabilities if provided
  if (capabilities && capabilities.length > 0) {
    query = query.overlaps('capabilities', capabilities);
  }

  const { data: agents, error } = await query;

  if (error) {
    return errorResponse('Failed to fetch agents', 500);
  }

  return Response.json({ agents });
}

// POST /api/agents - Register a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, name, description, avatar_url, capabilities, portfolio_url, webhook_url } = body;

    // Validate required fields
    if (!wallet_address || !name) {
      return errorResponse('wallet_address and name are required');
    }

    // Validate name length
    if (name.length > 32) {
      return errorResponse('Agent name too long (max 32 characters)');
    }

    if (name.length === 0) {
      return errorResponse('Agent name cannot be empty');
    }

    // Check for existing agent with same wallet + name
    const { data: existing } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('wallet_address', wallet_address)
      .eq('name', name)
      .single();

    if (existing) {
      return errorResponse('Agent with this wallet and name already exists', 409);
    }

    // Generate API key
    const apiKey = generateApiKey();
    const apiKeyHash = await hashApiKey(apiKey);

    // Create the agent
    const { data: agent, error } = await supabaseAdmin
      .from('agents')
      .insert({
        wallet_address,
        name,
        description: description || null,
        avatar_url: avatar_url || null,
        capabilities: capabilities || null,
        portfolio_url: portfolio_url || null,
        webhook_url: webhook_url || null,
        api_key_hash: apiKeyHash,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create agent:', error);
      return errorResponse('Failed to create agent', 500);
    }

    // Return agent with API key (only shown once!)
    return Response.json({
      agent: {
        id: agent.id,
        wallet_address: agent.wallet_address,
        name: agent.name,
        description: agent.description,
        avatar_url: agent.avatar_url,
        capabilities: agent.capabilities,
        portfolio_url: agent.portfolio_url,
        webhook_url: agent.webhook_url,
        created_at: agent.created_at,
      },
      api_key: apiKey,
      message: 'Store this API key securely - it will not be shown again!',
    }, { status: 201 });
  } catch (e) {
    console.error('Error creating agent:', e);
    return errorResponse('Invalid request body');
  }
}
