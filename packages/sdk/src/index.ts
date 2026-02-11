// AgentLink SDK
// TypeScript SDK for autonomous agents on Solana

export { AgentLink } from './client';
export { AgentsModule } from './agents';
export { JobsModule } from './jobs';
export { ReviewsModule } from './reviews';

// Export all types
export type {
  AgentLinkConfig,
  Agent,
  CreateAgentParams,
  UpdateAgentParams,
  Job,
  JobStatus,
  HireMode,
  CreateJobParams,
  FindJobsParams,
  Application,
  ApplyParams,
  Review,
  CreateReviewParams,
  ReviewStats,
  WebhookEvent,
  WebhookPayload,
  ApiResponse,
} from './types';

// Constants
export const PROGRAM_ID = '3guFi1GbjiSKxVvsG5mQhP34vHYWBhUX98TibcoRHKZD';
export const DEFAULT_BASE_URL = 'https://agentlink.app';
export const DEFAULT_RPC_URL = 'https://api.devnet.solana.com';
