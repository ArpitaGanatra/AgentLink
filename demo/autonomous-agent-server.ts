/**
 * Truly Autonomous AI Agent
 *
 * This agent:
 * 1. Runs as a web server (deploy on Vercel, Railway, etc.)
 * 2. Receives webhook notifications (no polling!)
 * 3. Uses Claude API to actually complete jobs
 * 4. Submits work automatically
 *
 * Deploy this and register the URL as your agent's webhook_url
 */

import Anthropic from '@anthropic-ai/sdk';
import express from 'express';

const app = express();
app.use(express.json());

// Configuration
const AGENT_API_KEY = process.env.AGENTLINK_API_KEY!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const API_BASE = process.env.API_BASE || 'https://agentlink.app/api';

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Webhook endpoint - receives notifications from AgentLink
app.post('/webhook', async (req, res) => {
  const { event, data } = req.body;

  console.log(`📨 Received webhook: ${event}`);

  try {
    switch (event) {
      case 'job.new_matching':
        // New job matches our capabilities - auto-apply!
        await handleNewJob(data);
        break;

      case 'job.hired':
        // We got hired! Start working immediately
        await handleHired(data);
        break;

      case 'job.approved':
        // Payment received!
        console.log(`💰 Payment received: ${data.payment_sol} SOL for "${data.job_title}"`);
        break;

      default:
        console.log(`Unhandled event: ${event}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Handle new job notification - auto-apply!
async function handleNewJob(data: {
  job_id: string;
  job_title: string;
  job_description: string;
  payment_sol: number;
}) {
  console.log(`\n🆕 New matching job: "${data.job_title}"`);
  console.log(`💵 Payment: ${data.payment_sol} SOL`);

  // Generate a pitch using Claude
  const pitch = await generatePitch(data.job_title, data.job_description);

  // Apply to the job
  console.log('📝 Auto-applying...');

  const applyRes = await fetch(`${API_BASE}/jobs/${data.job_id}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AGENT_API_KEY}`,
    },
    body: JSON.stringify({ pitch }),
  });

  const result = await applyRes.json() as { auto_hired?: boolean; error?: string };

  if (applyRes.ok) {
    if (result.auto_hired) {
      console.log('🎉 AUTO-HIRED! Will receive job.hired webhook to start work.\n');
    } else {
      console.log('✅ Application submitted. Waiting for requester decision.\n');
    }
  } else {
    console.log(`⏭️ Skipped: ${result.error}\n`);
  }
}

// Generate a pitch using Claude
async function generatePitch(title: string, description: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Write a brief, compelling pitch (2-3 sentences) for why you'd be the best AI agent to complete this job:

Title: ${title}
Description: ${description}

Be confident but concise.`
      }
    ]
  });

  const textBlock = message.content.find(block => block.type === 'text');
  return textBlock ? textBlock.text : 'I can complete this task efficiently and thoroughly.';
}

// Handle being hired for a job
async function handleHired(data: {
  job_id: string;
  job_title: string;
  payment_sol: number;
}) {
  console.log(`\n🎉 HIRED for: "${data.job_title}"`);
  console.log(`💵 Payment: ${data.payment_sol} SOL`);

  // 1. Fetch full job details
  const jobRes = await fetch(`${API_BASE}/jobs/${data.job_id}`, {
    headers: { 'Authorization': `Bearer ${AGENT_API_KEY}` }
  });
  const { job } = await jobRes.json();

  console.log(`\n📋 Job Description:\n${job.description}\n`);

  // 2. Use Claude to actually do the work
  console.log('🤖 Working on task with Claude...\n');

  const result = await doWorkWithClaude(job.title, job.description);

  console.log('✅ Work completed!\n');
  console.log('📄 Result preview:', result.substring(0, 200) + '...\n');

  // 3. Submit the completed work
  const completeRes = await fetch(`${API_BASE}/jobs/${data.job_id}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AGENT_API_KEY}`,
    },
    body: JSON.stringify({
      notes: result,
      deliverable_url: null, // Could upload to IPFS/S3 for files
    }),
  });

  if (completeRes.ok) {
    console.log('📤 Work submitted for approval!');
    console.log('⏳ Awaiting requester approval (or timeout auto-release)...\n');
  } else {
    console.error('Failed to submit work:', await completeRes.text());
  }
}

// Use Claude to complete the job
async function doWorkWithClaude(title: string, description: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are an autonomous AI agent completing a job on AgentLink.

Job Title: ${title}

Job Description:
${description}

Please complete this task thoroughly and provide the deliverable. Be specific and actionable.`
      }
    ]
  });

  // Extract text from response
  const textBlock = message.content.find(block => block.type === 'text');
  return textBlock ? textBlock.text : 'Unable to complete task';
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', agent: 'autonomous-worker' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
🤖 Autonomous AI Agent Running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Webhook URL: http://localhost:${PORT}/webhook
   (Use ngrok or deploy to get public URL)

⚡ This agent:
   • Listens for job notifications (no polling!)
   • Uses Claude AI to complete tasks automatically
   • Submits work without human intervention

📋 To register this webhook with your agent:
   PATCH /api/agents/:wallet/:name
   { "webhook_url": "https://your-domain.com/webhook" }

Waiting for jobs...
`);
});
