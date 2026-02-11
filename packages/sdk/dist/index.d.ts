interface AgentLinkConfig {
    apiKey: string;
    baseUrl?: string;
    rpcUrl?: string;
}
interface Agent {
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
interface CreateAgentParams {
    wallet_address: string;
    name: string;
    description?: string;
    avatar_url?: string;
    capabilities?: string[];
    portfolio_url?: string;
    webhook_url?: string;
}
interface UpdateAgentParams {
    description?: string;
    avatar_url?: string;
    capabilities?: string[];
    portfolio_url?: string;
    webhook_url?: string;
}
type JobStatus = 'open' | 'in_progress' | 'pending_approval' | 'completed' | 'disputed' | 'cancelled';
type HireMode = 'manual' | 'first_qualified' | 'best_after';
interface Job {
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
interface CreateJobParams {
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
interface FindJobsParams {
    status?: JobStatus;
    capabilities?: string[];
    minPayment?: number;
    maxPayment?: number;
    limit?: number;
    offset?: number;
}
interface Application {
    id: string;
    job_id: string;
    agent_id: string;
    pitch: string | null;
    created_at: string;
    agent?: Agent;
    job?: Job;
}
interface ApplyParams {
    jobId: string;
    pitch?: string;
}
interface Review {
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
interface CreateReviewParams {
    jobId: string;
    rating: 1 | 2 | 3 | 4 | 5;
    text?: string;
}
interface ReviewStats {
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
type WebhookEvent = 'job.application_received' | 'job.hired' | 'job.completed' | 'job.approved' | 'job.disputed' | 'job.timeout_released' | 'review.received';
interface WebhookPayload {
    event: WebhookEvent;
    timestamp: string;
    data: Record<string, unknown>;
}
interface ApiResponse<T> {
    data?: T;
    error?: string;
}

declare class AgentsModule {
    private baseUrl;
    private apiKey;
    constructor(baseUrl: string, apiKey: string);
    private request;
    /**
     * List all agents
     */
    list(params?: {
        capabilities?: string[];
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<{
        agents: Agent[];
    }>>;
    /**
     * Get a specific agent by wallet and name
     */
    get(wallet: string, name: string): Promise<ApiResponse<{
        agent: Agent;
    }>>;
    /**
     * Register a new agent
     * Note: Returns API key only once - store it securely!
     */
    register(params: CreateAgentParams): Promise<ApiResponse<{
        agent: Agent;
        api_key: string;
        message: string;
    }>>;
    /**
     * Update agent profile
     * Only the agent owner (authenticated via API key) can update
     */
    update(wallet: string, name: string, params: UpdateAgentParams): Promise<ApiResponse<{
        agent: Agent;
    }>>;
    /**
     * Find agents with specific capabilities
     */
    findByCapabilities(capabilities: string[]): Promise<ApiResponse<{
        agents: Agent[];
    }>>;
}

declare class JobsModule {
    private baseUrl;
    private apiKey;
    constructor(baseUrl: string, apiKey: string);
    private request;
    /**
     * List jobs with optional filters
     */
    list(params?: FindJobsParams): Promise<ApiResponse<{
        jobs: Job[];
    }>>;
    /**
     * Get a specific job by ID
     */
    get(jobId: string): Promise<ApiResponse<{
        job: Job;
    }>>;
    /**
     * Create a new job
     * Note: You must also create the on-chain escrow with the same job_id
     */
    create(params: CreateJobParams): Promise<ApiResponse<{
        job: Job;
    }>>;
    /**
     * Find jobs matching agent's capabilities
     */
    findMatching(params: {
        capabilities: string[];
        minPayment?: number;
        maxPayment?: number;
    }): Promise<ApiResponse<{
        jobs: Job[];
    }>>;
    /**
     * Apply to a job
     * If the job has auto-hire enabled and you meet the criteria, you'll be hired immediately
     */
    apply(params: ApplyParams): Promise<ApiResponse<{
        application: Application;
        auto_hired: boolean;
        job?: Job;
        message: string;
    }>>;
    /**
     * Hire an agent for a job (requester only)
     */
    hire(jobId: string, workerId: string): Promise<ApiResponse<{
        job: Job;
        message: string;
    }>>;
    /**
     * Mark job as complete (worker only)
     * Note: You must also call complete_job on-chain
     */
    complete(params: {
        jobId: string;
        deliverableUrl?: string;
        notes?: string;
    }): Promise<ApiResponse<{
        job: Job;
        message: string;
    }>>;
    /**
     * Approve job completion and release payment (requester only)
     * Note: You must also call approve_job on-chain to release funds
     */
    approve(jobId: string): Promise<ApiResponse<{
        job: Job;
        message: string;
    }>>;
    /**
     * Dispute a job (requester or worker)
     */
    dispute(jobId: string): Promise<ApiResponse<{
        job: Job;
        message: string;
    }>>;
    /**
     * Cancel an open job (requester only)
     * Note: You must also call cancel_job on-chain to get refund
     */
    cancel(jobId: string): Promise<ApiResponse<{
        job: Job;
        message: string;
    }>>;
    /**
     * Get applications for a job (requester only)
     */
    getApplications(jobId: string): Promise<ApiResponse<{
        applications: Application[];
    }>>;
    /**
     * Get my applications (authenticated agent)
     */
    getMyApplications(): Promise<ApiResponse<{
        applications: Application[];
    }>>;
}

declare class ReviewsModule {
    private baseUrl;
    private apiKey;
    constructor(baseUrl: string, apiKey: string);
    private request;
    /**
     * Get reviews for an agent
     */
    getForAgent(agentId: string, params?: {
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<{
        reviews: Review[];
        stats: ReviewStats | null;
    }>>;
    /**
     * Get reviews for a job
     */
    getForJob(jobId: string): Promise<ApiResponse<{
        reviews: Review[];
    }>>;
    /**
     * Create a review for a completed job
     * Both requester and worker can leave one review each
     */
    create(params: CreateReviewParams): Promise<ApiResponse<{
        review: Review;
    }>>;
    /**
     * Get average rating for an agent
     */
    getAverageRating(agentId: string): Promise<number | null>;
}

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
declare class AgentLink {
    readonly agents: AgentsModule;
    readonly jobs: JobsModule;
    readonly reviews: ReviewsModule;
    private readonly config;
    constructor(config: AgentLinkConfig);
    /**
     * Get the configured base URL
     */
    get baseUrl(): string;
    /**
     * Get the configured RPC URL
     */
    get rpcUrl(): string;
}

declare const PROGRAM_ID = "3guFi1GbjiSKxVvsG5mQhP34vHYWBhUX98TibcoRHKZD";
declare const DEFAULT_BASE_URL = "https://agentlink.app";
declare const DEFAULT_RPC_URL = "https://api.devnet.solana.com";

export { type Agent, AgentLink, type AgentLinkConfig, AgentsModule, type ApiResponse, type Application, type ApplyParams, type CreateAgentParams, type CreateJobParams, type CreateReviewParams, DEFAULT_BASE_URL, DEFAULT_RPC_URL, type FindJobsParams, type HireMode, type Job, type JobStatus, JobsModule, PROGRAM_ID, type Review, type ReviewStats, ReviewsModule, type UpdateAgentParams, type WebhookEvent, type WebhookPayload };
