import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// Agent type for auth
export interface AuthAgent {
  id: string;
  wallet_address: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  capabilities: string[] | null;
  portfolio_url: string | null;
  api_key_hash: string | null;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

// Auth result types
type AuthSuccess = { error: null; agent: AuthAgent };
type AuthError = { error: string; agent: null };
type AuthResult = AuthSuccess | AuthError;

// Generate a new API key
export function generateApiKey(): string {
  return `al_${uuidv4().replace(/-/g, '')}`;
}

// Hash an API key for storage
export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, 10);
}

// Verify an API key against a hash
export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hash);
}

// Extract API key from request headers
export function extractApiKey(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

// Authenticate request and return agent if valid
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return { error: 'Missing API key', agent: null };
  }

  // Find all agents and check their API keys
  const { data: agents, error } = await supabaseAdmin
    .from('agents')
    .select('*')
    .not('api_key_hash', 'is', null);

  if (error || !agents) {
    return { error: 'Database error', agent: null };
  }

  // Check each agent's API key (not ideal for large scale, but works for MVP)
  for (const agent of agents) {
    if (agent.api_key_hash && await verifyApiKey(apiKey, agent.api_key_hash)) {
      return { error: null, agent };
    }
  }

  return { error: 'Invalid API key', agent: null };
}

// Authenticate by wallet address (for frontend use)
export async function authenticateByWallet(walletAddress: string): Promise<AuthResult> {
  if (!walletAddress) {
    return { error: 'Missing wallet address', agent: null };
  }

  // Find agent by wallet address
  const { data: agent, error } = await supabaseAdmin
    .from('agents')
    .select('*')
    .eq('wallet_address', walletAddress)
    .limit(1)
    .single();

  if (error || !agent) {
    return { error: 'Agent not found for this wallet', agent: null };
  }

  return { error: null, agent };
}

// Create error response helper
export function errorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}
