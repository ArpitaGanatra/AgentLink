import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq client (FREE!)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const AGENT_API_KEY = process.env.AGENTLINK_API_KEY!;
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

// ============================================
// CUSTOMIZE YOUR AGENT HERE
// ============================================

// Your agent's system prompt - defines its personality and skills
const AGENT_SYSTEM_PROMPT = `You are an autonomous AI agent on AgentLink.
You specialize in:
- Research and analysis
- Data processing
- Writing and content creation

You complete tasks thoroughly, accurately, and professionally.
Always provide actionable, well-structured deliverables.`;

// Generate a pitch for job applications
async function generatePitch(title: string, description: string): Promise<string> {
  const message = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Write a brief, compelling pitch (2-3 sentences) for why you'd be the best AI agent to complete this job:

Title: ${title}
Description: ${description}

Be confident but concise.`
    }]
  });

  return message.choices[0]?.message?.content || 'I can complete this task efficiently and thoroughly.';
}

// Complete the actual work using Groq
async function completeWork(title: string, description: string): Promise<string> {
  const message = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 4096,
    messages: [
      {
        role: 'system',
        content: AGENT_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `Complete this job:

Title: ${title}

Description:
${description}

Provide a comprehensive, professional deliverable.`
      }
    ]
  });

  return message.choices[0]?.message?.content || 'Unable to complete task';
}

// ============================================
// WEBHOOK HANDLERS
// ============================================

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

interface NewJobData {
  job_id: string;
  job_title: string;
  job_description: string;
  payment_sol: number;
  requirements?: string[];
}

interface HiredData {
  job_id: string;
  job_title: string;
  payment_sol: number;
}

interface ApprovedData {
  job_id: string;
  job_title: string;
  payment_sol: number;
}

// Handle new matching job - auto-apply!
async function handleNewJob(data: NewJobData) {
  try {
    console.log(`🆕 New matching job: "${data.job_title}" (${data.payment_sol} SOL)`);
    console.log(`   API_BASE: ${API_BASE}`);
    console.log(`   AGENT_API_KEY: ${AGENT_API_KEY?.substring(0, 10)}...`);

    // Generate a pitch
    console.log(`📝 Generating pitch with Groq (Llama 3.3)...`);
    const pitch = await generatePitch(data.job_title, data.job_description);
    console.log(`📝 Generated pitch: ${pitch.substring(0, 100)}...`);

    // Apply to the job
    console.log(`🚀 Applying to job ${data.job_id}...`);
    const response = await fetch(`${API_BASE}/jobs/${data.job_id}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AGENT_API_KEY}`,
      },
      body: JSON.stringify({ pitch }),
    });

    const result = await response.json() as { auto_hired?: boolean; error?: string };
    console.log(`📬 Apply response:`, result);

    if (response.ok) {
      if (result.auto_hired) {
        console.log(`🎉 AUTO-HIRED! Starting work...`);
      } else {
        console.log(`✅ Application submitted`);
      }
    } else {
      console.log(`⏭️ Skipped: ${result.error}`);
    }
  } catch (error) {
    console.error(`❌ Error in handleNewJob:`, error);
  }
}

// Handle being hired - do the work!
async function handleHired(data: HiredData) {
  console.log(`🎉 HIRED for: "${data.job_title}" (${data.payment_sol} SOL)`);

  // Fetch full job details
  const jobResponse = await fetch(`${API_BASE}/jobs/${data.job_id}`, {
    headers: { 'Authorization': `Bearer ${AGENT_API_KEY}` },
  });
  const { job } = await jobResponse.json();

  console.log(`⚙️ Working on task with Groq (Llama 3.3)...`);

  // Complete the work using Groq
  const result = await completeWork(job.title, job.description);

  console.log(`✅ Work completed (${result.length} chars)`);

  // Submit the completed work
  const completeResponse = await fetch(`${API_BASE}/jobs/${data.job_id}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AGENT_API_KEY}`,
    },
    body: JSON.stringify({
      notes: result,
      deliverable_url: null,
    }),
  });

  if (completeResponse.ok) {
    console.log(`📤 Work submitted! Awaiting approval...`);
  } else {
    console.error(`❌ Failed to submit work`);
  }
}

// Handle job approved - payment received!
async function handleApproved(data: ApprovedData) {
  console.log(`💰 Payment received: ${data.payment_sol} SOL for "${data.job_title}"`);
}

// ============================================
// MAIN WEBHOOK ENDPOINT
// ============================================

export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json();
    const { event, data } = payload;

    console.log(`📨 Webhook received: ${event}`);
    console.log(`📦 Data:`, JSON.stringify(data).substring(0, 200));

    // Process in background but catch errors
    (async () => {
      try {
        switch (event) {
          case 'job.new_matching':
            await handleNewJob(data as unknown as NewJobData);
            break;

          case 'job.hired':
            await handleHired(data as unknown as HiredData);
            break;

          case 'job.approved':
            await handleApproved(data as unknown as ApprovedData);
            break;

          default:
            console.log(`Unhandled event: ${event}`);
        }
      } catch (err) {
        console.error(`❌ Handler error for ${event}:`, err);
      }
    })();

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return Response.json({
    status: 'ok',
    agent: 'AgentLink Autonomous Agent',
    version: '1.0.0',
    model: 'Groq Llama 3.3 70B (FREE)',
  });
}
