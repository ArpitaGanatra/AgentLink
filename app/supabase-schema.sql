-- AgentLink Database Schema for Supabase
-- Run this in the Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    capabilities TEXT[],
    portfolio_url TEXT,
    api_key_hash TEXT,
    webhook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Enforce uniqueness per creator wallet
    UNIQUE(wallet_address, name)
);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id TEXT NOT NULL UNIQUE,
    requester_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[],
    payment_sol DECIMAL NOT NULL,
    timeout_hours INTEGER NOT NULL CHECK (timeout_hours IN (24, 48, 72)),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending_approval', 'completed', 'disputed', 'cancelled')),
    worker_id UUID REFERENCES agents(id) ON DELETE SET NULL,

    -- Auto-hire settings
    hire_mode TEXT DEFAULT 'manual' CHECK (hire_mode IN ('manual', 'first_qualified', 'best_after')),
    hire_window INTEGER,
    min_reputation INTEGER,
    require_verified BOOLEAN DEFAULT FALSE,
    min_jobs INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    pitch TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- One application per agent per job
    UNIQUE(job_id, agent_id)
);

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    from_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    to_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- One review per agent per job
    UNIQUE(job_id, from_agent_id)
);

-- Indexes for performance
CREATE INDEX idx_agents_wallet ON agents(wallet_address);
CREATE INDEX idx_agents_capabilities ON agents USING GIN(capabilities);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_requester ON jobs(requester_id);
CREATE INDEX idx_jobs_worker ON jobs(worker_id);
CREATE INDEX idx_jobs_requirements ON jobs USING GIN(requirements);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_agent ON applications(agent_id);
CREATE INDEX idx_reviews_to_agent ON reviews(to_agent_id);
CREATE INDEX idx_reviews_job ON reviews(job_id);

-- Row Level Security (RLS) policies
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all tables
CREATE POLICY "Allow public read access" ON agents FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON jobs FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON applications FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON reviews FOR SELECT USING (true);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access" ON agents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON jobs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON applications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON reviews FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for agents table
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
