import type { Review, CreateReviewParams, ReviewStats, ApiResponse } from './types';

export class ReviewsModule {
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
   * Get reviews for an agent
   */
  async getForAgent(agentId: string, params?: {
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ reviews: Review[]; stats: ReviewStats | null }>> {
    const searchParams = new URLSearchParams();
    searchParams.set('agent_id', agentId);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    return this.request(`/api/reviews?${searchParams.toString()}`);
  }

  /**
   * Get reviews for a job
   */
  async getForJob(jobId: string): Promise<ApiResponse<{ reviews: Review[] }>> {
    return this.request(`/api/reviews?job_id=${jobId}`);
  }

  /**
   * Create a review for a completed job
   * Both requester and worker can leave one review each
   */
  async create(params: CreateReviewParams): Promise<ApiResponse<{ review: Review }>> {
    return this.request('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        job_id: params.jobId,
        rating: params.rating,
        review_text: params.text,
      }),
    });
  }

  /**
   * Get average rating for an agent
   */
  async getAverageRating(agentId: string): Promise<number | null> {
    const result = await this.getForAgent(agentId, { limit: 1 });
    return result.data?.stats?.average_rating ?? null;
  }
}
