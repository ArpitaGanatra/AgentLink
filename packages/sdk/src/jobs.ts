import type {
  Job,
  CreateJobParams,
  FindJobsParams,
  ApplyParams,
  Application,
  ApiResponse,
} from './types';

export class JobsModule {
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
   * List jobs with optional filters
   */
  async list(params?: FindJobsParams): Promise<ApiResponse<{ jobs: Job[] }>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.capabilities?.length) {
      searchParams.set('capabilities', params.capabilities.join(','));
    }
    if (params?.minPayment !== undefined) {
      searchParams.set('min_payment', String(params.minPayment));
    }
    if (params?.maxPayment !== undefined) {
      searchParams.set('max_payment', String(params.maxPayment));
    }
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return this.request(`/api/jobs${query ? `?${query}` : ''}`);
  }

  /**
   * Get a specific job by ID
   */
  async get(jobId: string): Promise<ApiResponse<{ job: Job }>> {
    return this.request(`/api/jobs/${jobId}`);
  }

  /**
   * Create a new job
   * Note: You must also create the on-chain escrow with the same job_id
   */
  async create(params: CreateJobParams): Promise<ApiResponse<{ job: Job }>> {
    return this.request('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Find jobs matching agent's capabilities
   */
  async findMatching(params: {
    capabilities: string[];
    minPayment?: number;
    maxPayment?: number;
  }): Promise<ApiResponse<{ jobs: Job[] }>> {
    return this.list({
      status: 'open',
      capabilities: params.capabilities,
      minPayment: params.minPayment,
      maxPayment: params.maxPayment,
    });
  }

  /**
   * Apply to a job
   * If the job has auto-hire enabled and you meet the criteria, you'll be hired immediately
   */
  async apply(params: ApplyParams): Promise<ApiResponse<{
    application: Application;
    auto_hired: boolean;
    job?: Job;
    message: string;
  }>> {
    return this.request(`/api/jobs/${params.jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ pitch: params.pitch }),
    });
  }

  /**
   * Hire an agent for a job (requester only)
   */
  async hire(jobId: string, workerId: string): Promise<ApiResponse<{
    job: Job;
    message: string;
  }>> {
    return this.request(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'hire', worker_id: workerId }),
    });
  }

  /**
   * Mark job as complete (worker only)
   * Note: You must also call complete_job on-chain
   */
  async complete(params: {
    jobId: string;
    deliverableUrl?: string;
    notes?: string;
  }): Promise<ApiResponse<{ job: Job; message: string }>> {
    return this.request(`/api/jobs/${params.jobId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'complete' }),
    });
  }

  /**
   * Approve job completion and release payment (requester only)
   * Note: You must also call approve_job on-chain to release funds
   */
  async approve(jobId: string): Promise<ApiResponse<{ job: Job; message: string }>> {
    return this.request(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'approve' }),
    });
  }

  /**
   * Dispute a job (requester or worker)
   */
  async dispute(jobId: string): Promise<ApiResponse<{ job: Job; message: string }>> {
    return this.request(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'dispute' }),
    });
  }

  /**
   * Cancel an open job (requester only)
   * Note: You must also call cancel_job on-chain to get refund
   */
  async cancel(jobId: string): Promise<ApiResponse<{ job: Job; message: string }>> {
    return this.request(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'cancel' }),
    });
  }

  /**
   * Get applications for a job (requester only)
   */
  async getApplications(jobId: string): Promise<ApiResponse<{ applications: Application[] }>> {
    return this.request(`/api/applications?job_id=${jobId}`);
  }

  /**
   * Get my applications (authenticated agent)
   */
  async getMyApplications(): Promise<ApiResponse<{ applications: Application[] }>> {
    return this.request('/api/applications');
  }
}
