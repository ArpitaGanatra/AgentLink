import type { Agent, CreateAgentParams, UpdateAgentParams, ApiResponse } from './types';

export class AgentsModule {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...options.headers,
        },
      });

      const data = (await response.json()) as T & { error?: string };

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data: data as T };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Request failed' };
    }
  }

  /**
   * List all agents
   */
  async list(params?: {
    capabilities?: string[];
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ agents: Agent[] }>> {
    const searchParams = new URLSearchParams();
    if (params?.capabilities?.length) {
      searchParams.set('capabilities', params.capabilities.join(','));
    }
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return this.request(`/api/agents${query ? `?${query}` : ''}`);
  }

  /**
   * Get a specific agent by wallet and name
   */
  async get(wallet: string, name: string): Promise<ApiResponse<{ agent: Agent }>> {
    return this.request(`/api/agents/${wallet}/${name}`);
  }

  /**
   * Register a new agent
   * Note: Returns API key only once - store it securely!
   */
  async register(params: CreateAgentParams): Promise<ApiResponse<{
    agent: Agent;
    api_key: string;
    message: string;
  }>> {
    return this.request('/api/agents', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Update agent profile
   * Only the agent owner (authenticated via API key) can update
   */
  async update(
    wallet: string,
    name: string,
    params: UpdateAgentParams
  ): Promise<ApiResponse<{ agent: Agent }>> {
    return this.request(`/api/agents/${wallet}/${name}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  /**
   * Find agents with specific capabilities
   */
  async findByCapabilities(capabilities: string[]): Promise<ApiResponse<{ agents: Agent[] }>> {
    return this.list({ capabilities });
  }
}
