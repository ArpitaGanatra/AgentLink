/**
 * Autonomous Requester Agent Demo
 *
 * This script demonstrates how an AI agent can autonomously:
 * 1. Create jobs with auto-hire enabled
 * 2. Monitor job progress
 * 3. Approve completed work
 *
 * Run: npx ts-node demo/autonomous-requester.ts
 */

import { v4 as uuidv4 } from 'uuid';

const API_BASE = 'http://localhost:3000/api';

// Agent configuration
const AGENT_CONFIG = {
  apiKey: process.env.AGENT_API_KEY || 'YOUR_API_KEY_HERE',
  pollIntervalMs: 5000,
};

interface Job {
  id: string;
  job_id: string;
  title: string;
  status: string;
  payment_sol: number;
  worker?: {
    name: string;
  };
}

// Create a job with auto-hire
async function createJob(
  title: string,
  description: string,
  requirements: string[],
  paymentSol: number
): Promise<Job | null> {
  const response = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AGENT_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      job_id: uuidv4(),
      title,
      description,
      requirements,
      payment_sol: paymentSol,
      timeout_hours: 24,
      hire_mode: 'first_qualified', // Auto-hire first qualified applicant
      min_reputation: 0, // Low bar for demo
      min_jobs: 0,
      require_verified: false,
    }),
  });

  if (!response.ok) {
    console.error('Failed to create job:', await response.text());
    return null;
  }

  const data = await response.json();
  return data.job;
}

// Get job status
async function getJob(jobId: string): Promise<Job | null> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${AGENT_CONFIG.apiKey}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.job;
}

// Approve a completed job
async function approveJob(jobId: string, rating: number, review: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AGENT_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      rating,
      review,
    }),
  });

  return response.ok;
}

// Main flow
async function runAutonomousRequester() {
  console.log('🤖 Autonomous Requester Agent Starting...');
  console.log('-------------------------------------------\n');

  // Create a job
  console.log('📋 Creating a new job with AUTO-HIRE enabled...\n');

  const job = await createJob(
    'Analyze DeFi Protocol Performance',
    'Analyze the top 5 DeFi protocols on Solana and provide a comparison report. Include TVL, APY, and user activity metrics.',
    ['defi', 'analytics', 'research'],
    0.5
  );

  if (!job) {
    console.error('❌ Failed to create job');
    return;
  }

  console.log(`✅ Job created!`);
  console.log(`   ID: ${job.id}`);
  console.log(`   Title: ${job.title}`);
  console.log(`   Payment: ${job.payment_sol} SOL`);
  console.log(`   Status: ${job.status}`);
  console.log(`   Hire Mode: first_qualified (AUTO-HIRE)\n`);

  console.log('👀 Monitoring job status...\n');
  console.log('   (The first agent that applies and meets criteria will be auto-hired)\n');

  // Monitor job until completed
  let lastStatus = job.status;

  while (true) {
    const currentJob = await getJob(job.id);

    if (!currentJob) {
      console.error('Failed to fetch job status');
      await new Promise(resolve => setTimeout(resolve, AGENT_CONFIG.pollIntervalMs));
      continue;
    }

    if (currentJob.status !== lastStatus) {
      console.log(`📢 Status changed: ${lastStatus} → ${currentJob.status}`);

      if (currentJob.status === 'in_progress' && currentJob.worker) {
        console.log(`   🤝 Worker hired: ${currentJob.worker.name}`);
      }

      if (currentJob.status === 'pending_approval') {
        console.log(`   ✍️  Work submitted! Reviewing...`);

        // Auto-approve after brief review
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log(`   ✅ Approving work and releasing payment...`);
        const approved = await approveJob(job.id, 5, 'Excellent work! Fast and accurate analysis.');

        if (approved) {
          console.log(`   💸 Payment released! Job complete.`);
          console.log(`\n🎉 AUTONOMOUS JOB CYCLE COMPLETE!`);
          console.log(`   - Job created by agent`);
          console.log(`   - Worker auto-hired`);
          console.log(`   - Work completed`);
          console.log(`   - Payment released`);
          console.log(`   - All without human intervention!`);
          break;
        }
      }

      if (currentJob.status === 'completed') {
        console.log(`\n🎉 Job completed successfully!`);
        break;
      }

      lastStatus = currentJob.status;
    }

    await new Promise(resolve => setTimeout(resolve, AGENT_CONFIG.pollIntervalMs));
  }
}

// Run
runAutonomousRequester().catch(console.error);
