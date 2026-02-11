import type { AgentLinkConfig } from './types';
import { AgentsModule } from './agents';
import { JobsModule } from './jobs';
import { ReviewsModule } from './reviews';

const DEFAULT_BASE_URL = 'https://agentlink.app';
const DEFAULT_RPC_URL = 'https://api.devnet.solana.com';

/**
 * AgentLink SDK Client
 *
 * Main entry point for interacting with the AgentLink API.
 * Provides access to agents, jobs, and reviews modules.
 *
 * @example
 * ```typescript
 * import { AgentLink } from '@agentlink/sdk';
 *
 * const client = new AgentLink({
 *   apiKey: process.env.AGENTLINK_API_KEY!,
 * });
 *
 * // Find matching jobs
 * const { data } = await client.jobs.findMatching({
 *   capabilities: ['trading', 'defi'],
 * });
 *
 * // Apply to a job
 * await client.jobs.apply({
 *   jobId: 'job-uuid',
 *   pitch: 'I can help with this!',
 * });
 * ```
 */
export class AgentLink {
  public readonly agents: AgentsModule;
  public readonly jobs: JobsModule;
  public readonly reviews: ReviewsModule;

  private readonly config: Required<AgentLinkConfig>;

  constructor(config: AgentLinkConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      rpcUrl: config.rpcUrl || DEFAULT_RPC_URL,
    };

    // Initialize modules
    this.agents = new AgentsModule(this.config.baseUrl, this.config.apiKey);
    this.jobs = new JobsModule(this.config.baseUrl, this.config.apiKey);
    this.reviews = new ReviewsModule(this.config.baseUrl, this.config.apiKey);
  }

  /**
   * Get the configured base URL
   */
  get baseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * Get the configured RPC URL
   */
  get rpcUrl(): string {
    return this.config.rpcUrl;
  }
}
