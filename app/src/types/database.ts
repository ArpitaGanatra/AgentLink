export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
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
        };
        Insert: {
          id?: string;
          wallet_address: string;
          name: string;
          description?: string | null;
          avatar_url?: string | null;
          capabilities?: string[] | null;
          portfolio_url?: string | null;
          api_key_hash?: string | null;
          webhook_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          name?: string;
          description?: string | null;
          avatar_url?: string | null;
          capabilities?: string[] | null;
          portfolio_url?: string | null;
          api_key_hash?: string | null;
          webhook_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          job_id: string;
          requester_id: string;
          title: string;
          description: string;
          requirements: string[] | null;
          payment_sol: number;
          timeout_hours: number;
          status: string;
          worker_id: string | null;
          hire_mode: string;
          hire_window: number | null;
          min_reputation: number | null;
          require_verified: boolean;
          min_jobs: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          requester_id: string;
          title: string;
          description: string;
          requirements?: string[] | null;
          payment_sol: number;
          timeout_hours: number;
          status?: string;
          worker_id?: string | null;
          hire_mode?: string;
          hire_window?: number | null;
          min_reputation?: number | null;
          require_verified?: boolean;
          min_jobs?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          requester_id?: string;
          title?: string;
          description?: string;
          requirements?: string[] | null;
          payment_sol?: number;
          timeout_hours?: number;
          status?: string;
          worker_id?: string | null;
          hire_mode?: string;
          hire_window?: number | null;
          min_reputation?: number | null;
          require_verified?: boolean;
          min_jobs?: number;
          created_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          job_id: string;
          agent_id: string;
          pitch: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          agent_id: string;
          pitch?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          agent_id?: string;
          pitch?: string | null;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          job_id: string;
          from_agent_id: string;
          to_agent_id: string;
          rating: number;
          review_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          from_agent_id: string;
          to_agent_id: string;
          rating: number;
          review_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          from_agent_id?: string;
          to_agent_id?: string;
          rating?: number;
          review_text?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// Convenience types
export type Agent = Database['public']['Tables']['agents']['Row'];
export type Job = Database['public']['Tables']['jobs']['Row'];
export type Application = Database['public']['Tables']['applications']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];

// Job statuses
export const JOB_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  PENDING_APPROVAL: 'pending_approval',
  COMPLETED: 'completed',
  DISPUTED: 'disputed',
  CANCELLED: 'cancelled',
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

// Hire modes
export const HIRE_MODE = {
  MANUAL: 'manual',
  FIRST_QUALIFIED: 'first_qualified',
  BEST_AFTER: 'best_after',
} as const;

export type HireMode = (typeof HIRE_MODE)[keyof typeof HIRE_MODE];
