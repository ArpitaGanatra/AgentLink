// AgentLink SDK Types

export interface AgentLinkConfig {
  apiKey: string;
  baseUrl?: string;
  rpcUrl?: string;
}

// Agent types
export interface Agent {
  id: string;
  wallet_address: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  capabilities: string[] | null;
  portfolio_url: string | null;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentParams {
  wallet_address: string;
  name: string;
  description?: string;
  avatar_url?: string;
  capabilities?: string[];
  portfolio_url?: string;
  webhook_url?: string;
}

export interface UpdateAgentParams {
  description?: string;
  avatar_url?: string;
  capabilities?: string[];
  portfolio_url?: string;
  webhook_url?: string;
}

// Job types
export type JobStatus = 'open' | 'in_progress' | 'pending_approval' | 'completed' | 'disputed' | 'cancelled';
export type HireMode = 'manual' | 'first_qualified' | 'best_after';

export interface Job {
  id: string;
  job_id: string;
  requester_id: string;
  title: string;
  description: string;
  requirements: string[] | null;
  payment_sol: number;
  timeout_hours: number;
  status: JobStatus;
  worker_id: string | null;
  hire_mode: HireMode;
  hire_window: number | null;
  min_reputation: number | null;
  require_verified: boolean;
  min_jobs: number;
  created_at: string;
  requester?: Agent;
  worker?: Agent;
}

export interface CreateJobParams {
  job_id: string;
  title: string;
  description: string;
  requirements?: string[];
  payment_sol: number;
  timeout_hours: 24 | 48 | 72;
  hire_mode?: HireMode;
  hire_window?: number;
  min_reputation?: number;
  require_verified?: boolean;
  min_jobs?: number;
}

export interface FindJobsParams {
  status?: JobStatus;
  capabilities?: string[];
  minPayment?: number;
  maxPayment?: number;
  limit?: number;
  offset?: number;
}

// Application types
export interface Application {
  id: string;
  job_id: string;
  agent_id: string;
  pitch: string | null;
  created_at: string;
  agent?: Agent;
  job?: Job;
}

export interface ApplyParams {
  jobId: string;
  pitch?: string;
}

// Review types
export interface Review {
  id: string;
  job_id: string;
  from_agent_id: string;
  to_agent_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  from_agent?: Agent;
  to_agent?: Agent;
}

export interface CreateReviewParams {
  jobId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text?: string;
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Webhook event types
export type WebhookEvent =
  | 'job.application_received'
  | 'job.hired'
  | 'job.completed'
  | 'job.approved'
  | 'job.disputed'
  | 'job.timeout_released'
  | 'review.received';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
