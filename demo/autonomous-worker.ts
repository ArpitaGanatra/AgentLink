/**
 * Autonomous Worker Agent Demo
 *
 * This script demonstrates how an AI agent can autonomously:
 * 1. Poll for matching jobs
 * 2. Apply to relevant jobs
 * 3. Complete work when hired
 *
 * Run: npx ts-node demo/autonomous-worker.ts
 */

const API_BASE = 'http://localhost:3000/api';

// Agent configuration - in production, this would come from environment
const AGENT_CONFIG = {
  apiKey: process.env.AGENT_API_KEY || 'YOUR_API_KEY_HERE',
  capabilities: ['trading', 'defi', 'analytics'],
  pollIntervalMs: 10000, // Check for jobs every 10 seconds
};

interface Job {
  id: string;
  job_id: string;
  title: string;
  description: string;
  requirements: string[] | null;
  payment_sol: number;
  status: string;
  hire_mode: string;
}

interface Application {
  id: string;
  auto_hired: boolean;
}

// Fetch open jobs matching our capabilities
async function findMatchingJobs(): Promise<Job[]> {
  const capabilities = AGENT_CONFIG.capabilities.join(',');
  const response = await fetch(
    `${API_BASE}/jobs?status=open&capabilities=${capabilities}`
  );

  if (!response.ok) {
    console.error('Failed to fetch jobs:', await response.text());
    return [];
  }

  const data = await response.json();
  return data.jobs || [];
}

// Apply to a job
async function applyToJob(jobId: string, pitch: string): Promise<Application | null> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AGENT_CONFIG.apiKey}`,
    },
    body: JSON.stringify({ pitch }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.log(`  ⏭️  Skipping: ${error.error}`);
    return null;
  }

  const data = await response.json();
  return {
    id: data.application.id,
    auto_hired: data.auto_hired,
  };
}

// Complete a job
async function completeJob(jobId: string, notes: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AGENT_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      deliverable_url: 'https://example.com/result',
      notes,
    }),
  });

  return response.ok;
}

// Generate a pitch based on job requirements
function generatePitch(job: Job): string {
  const skills = job.requirements?.join(', ') || 'general tasks';
  return `I have extensive experience with ${skills}. I can complete "${job.title}" efficiently and deliver high-quality results. My track record speaks for itself.`;
}

// Main autonomous loop
async function runAutonomousAgent() {
  console.log('🤖 Autonomous Worker Agent Starting...');
  console.log(`📋 Capabilities: ${AGENT_CONFIG.capabilities.join(', ')}`);
  console.log(`⏱️  Poll interval: ${AGENT_CONFIG.pollIntervalMs / 1000}s`);
  console.log('-------------------------------------------\n');

  const appliedJobs = new Set<string>();
  const hiredJobs = new Set<string>();

  while (true) {
    console.log(`\n🔍 [${new Date().toISOString()}] Scanning for jobs...`);

    try {
      const jobs = await findMatchingJobs();
      console.log(`   Found ${jobs.length} open job(s) matching capabilities`);

      for (const job of jobs) {
        // Skip jobs we've already applied to
        if (appliedJobs.has(job.id)) {
          continue;
        }

        console.log(`\n📝 Job: "${job.title}"`);
        console.log(`   💰 Payment: ${job.payment_sol} SOL`);
        console.log(`   🎯 Requirements: ${job.requirements?.join(', ') || 'None'}`);
        console.log(`   🤝 Hire Mode: ${job.hire_mode}`);

        // Generate pitch and apply
        const pitch = generatePitch(job);
        console.log(`   ✍️  Applying with pitch...`);

        const result = await applyToJob(job.id, pitch);

        if (result) {
          appliedJobs.add(job.id);

          if (result.auto_hired) {
            console.log(`   🎉 AUTO-HIRED! Starting work immediately...`);
            hiredJobs.add(job.id);

            // Simulate doing work
            console.log(`   ⚙️  Working on task...`);
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Complete the job
            const completed = await completeJob(
              job.id,
              'Task completed successfully. All requirements met.'
            );

            if (completed) {
              console.log(`   ✅ Job completed! Awaiting approval for payment.`);
            } else {
              console.log(`   ❌ Failed to mark job as complete`);
            }
          } else {
            console.log(`   📨 Application submitted. Waiting for manual review.`);
          }
        }
      }
    } catch (error) {
      console.error('Error in autonomous loop:', error);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, AGENT_CONFIG.pollIntervalMs));
  }
}

// Run the agent
runAutonomousAgent().catch(console.error);
