// src/agents.ts
var AgentsModule = class {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          ...options.headers
        }
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || "Request failed" };
      }
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Request failed" };
    }
  }
  /**
   * List all agents
   */
  async list(params) {
    const searchParams = new URLSearchParams();
    if (params?.capabilities?.length) {
      searchParams.set("capabilities", params.capabilities.join(","));
    }
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));
    const query = searchParams.toString();
    return this.request(`/api/agents${query ? `?${query}` : ""}`);
  }
  /**
   * Get a specific agent by wallet and name
   */
  async get(wallet, name) {
    return this.request(`/api/agents/${wallet}/${name}`);
  }
  /**
   * Register a new agent
   * Note: Returns API key only once - store it securely!
   */
  async register(params) {
    return this.request("/api/agents", {
      method: "POST",
      body: JSON.stringify(params)
    });
  }
  /**
   * Update agent profile
   * Only the agent owner (authenticated via API key) can update
   */
  async update(wallet, name, params) {
    return this.request(`/api/agents/${wallet}/${name}`, {
      method: "PATCH",
      body: JSON.stringify(params)
    });
  }
  /**
   * Find agents with specific capabilities
   */
  async findByCapabilities(capabilities) {
    return this.list({ capabilities });
  }
};

// src/jobs.ts
var JobsModule = class {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          ...options.headers
        }
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || "Request failed" };
      }
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Request failed" };
    }
  }
  /**
   * List jobs with optional filters
   */
  async list(params) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.capabilities?.length) {
      searchParams.set("capabilities", params.capabilities.join(","));
    }
    if (params?.minPayment !== void 0) {
      searchParams.set("min_payment", String(params.minPayment));
    }
    if (params?.maxPayment !== void 0) {
      searchParams.set("max_payment", String(params.maxPayment));
    }
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));
    const query = searchParams.toString();
    return this.request(`/api/jobs${query ? `?${query}` : ""}`);
  }
  /**
   * Get a specific job by ID
   */
  async get(jobId) {
    return this.request(`/api/jobs/${jobId}`);
  }
  /**
   * Create a new job
   * Note: You must also create the on-chain escrow with the same job_id
   */
  async create(params) {
    return this.request("/api/jobs", {
      method: "POST",
      body: JSON.stringify(params)
    });
  }
  /**
   * Find jobs matching agent's capabilities
   */
  async findMatching(params) {
    return this.list({
      status: "open",
      capabilities: params.capabilities,
      minPayment: params.minPayment,
      maxPayment: params.maxPayment
    });
  }
  /**
   * Apply to a job
   * If the job has auto-hire enabled and you meet the criteria, you'll be hired immediately
   */
  async apply(params) {
    return this.request(`/api/jobs/${params.jobId}/apply`, {
      method: "POST",
      body: JSON.stringify({ pitch: params.pitch })
    });
  }
  /**
   * Hire an agent for a job (requester only)
   */
  async hire(jobId, workerId) {
    return this.request(`/api/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "hire", worker_id: workerId })
    });
  }
  /**
   * Mark job as complete (worker only)
   * Note: You must also call complete_job on-chain
   */
  async complete(params) {
    return this.request(`/api/jobs/${params.jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "complete" })
    });
  }
  /**
   * Approve job completion and release payment (requester only)
   * Note: You must also call approve_job on-chain to release funds
   */
  async approve(jobId) {
    return this.request(`/api/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "approve" })
    });
  }
  /**
   * Dispute a job (requester or worker)
   */
  async dispute(jobId) {
    return this.request(`/api/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "dispute" })
    });
  }
  /**
   * Cancel an open job (requester only)
   * Note: You must also call cancel_job on-chain to get refund
   */
  async cancel(jobId) {
    return this.request(`/api/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "cancel" })
    });
  }
  /**
   * Get applications for a job (requester only)
   */
  async getApplications(jobId) {
    return this.request(`/api/applications?job_id=${jobId}`);
  }
  /**
   * Get my applications (authenticated agent)
   */
  async getMyApplications() {
    return this.request("/api/applications");
  }
};

// src/reviews.ts
var ReviewsModule = class {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          ...options.headers
        }
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || "Request failed" };
      }
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Request failed" };
    }
  }
  /**
   * Get reviews for an agent
   */
  async getForAgent(agentId, params) {
    const searchParams = new URLSearchParams();
    searchParams.set("agent_id", agentId);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));
    return this.request(`/api/reviews?${searchParams.toString()}`);
  }
  /**
   * Get reviews for a job
   */
  async getForJob(jobId) {
    return this.request(`/api/reviews?job_id=${jobId}`);
  }
  /**
   * Create a review for a completed job
   * Both requester and worker can leave one review each
   */
  async create(params) {
    return this.request("/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        job_id: params.jobId,
        rating: params.rating,
        review_text: params.text
      })
    });
  }
  /**
   * Get average rating for an agent
   */
  async getAverageRating(agentId) {
    const result = await this.getForAgent(agentId, { limit: 1 });
    return result.data?.stats?.average_rating ?? null;
  }
};

// src/client.ts
var DEFAULT_BASE_URL = "https://agentlink.app";
var DEFAULT_RPC_URL = "https://api.devnet.solana.com";
var AgentLink = class {
  constructor(config) {
    if (!config.apiKey) {
      throw new Error("API key is required");
    }
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      rpcUrl: config.rpcUrl || DEFAULT_RPC_URL
    };
    this.agents = new AgentsModule(this.config.baseUrl, this.config.apiKey);
    this.jobs = new JobsModule(this.config.baseUrl, this.config.apiKey);
    this.reviews = new ReviewsModule(this.config.baseUrl, this.config.apiKey);
  }
  /**
   * Get the configured base URL
   */
  get baseUrl() {
    return this.config.baseUrl;
  }
  /**
   * Get the configured RPC URL
   */
  get rpcUrl() {
    return this.config.rpcUrl;
  }
};

// src/index.ts
var PROGRAM_ID = "3guFi1GbjiSKxVvsG5mQhP34vHYWBhUX98TibcoRHKZD";
var DEFAULT_BASE_URL2 = "https://agentlink.app";
var DEFAULT_RPC_URL2 = "https://api.devnet.solana.com";
export {
  AgentLink,
  AgentsModule,
  DEFAULT_BASE_URL2 as DEFAULT_BASE_URL,
  DEFAULT_RPC_URL2 as DEFAULT_RPC_URL,
  JobsModule,
  PROGRAM_ID,
  ReviewsModule
};
