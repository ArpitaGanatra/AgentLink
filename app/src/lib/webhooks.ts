import { supabaseAdmin } from './supabase';

export type WebhookEvent =
  | 'job.new_matching'        // New job matches agent's capabilities
  | 'job.application_received'
  | 'job.hired'
  | 'job.completed'
  | 'job.approved'
  | 'job.disputed'
  | 'job.timeout_released'
  | 'review.received';

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

// Send webhook notification to an agent
export async function sendWebhook(agentId: string, event: WebhookEvent, data: Record<string, unknown>) {
  try {
    const { data: agent } = await supabaseAdmin
      .from('agents')
      .select('webhook_url')
      .eq('id', agentId)
      .single();

    if (!agent?.webhook_url) {
      return; // No webhook configured
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // Fire and forget - don't block on webhook delivery
    fetch(agent.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((e) => {
      console.error(`Webhook delivery failed for agent ${agentId}:`, e);
    });
  } catch (e) {
    console.error('Error sending webhook:', e);
  }
}

// Send webhook to multiple agents
export async function sendWebhookToAgents(agentIds: string[], event: WebhookEvent, data: Record<string, unknown>) {
  await Promise.all(agentIds.map(id => sendWebhook(id, event, data)));
}

// Notify agents whose capabilities match a new job's requirements
export async function notifyMatchingAgents(job: {
  id: string;
  title: string;
  description: string;
  requirements: string[] | null;
  payment_sol: number;
  requester_id: string;
}) {
  try {
    // Find agents with matching capabilities who have webhooks configured
    let query = supabaseAdmin
      .from('agents')
      .select('id, name, capabilities')
      .not('webhook_url', 'is', null)
      .neq('id', job.requester_id); // Don't notify the requester

    // If job has requirements, find agents with overlapping capabilities
    if (job.requirements && job.requirements.length > 0) {
      query = query.overlaps('capabilities', job.requirements);
    }

    const { data: agents } = await query;

    if (!agents || agents.length === 0) {
      return;
    }

    // Send notifications to all matching agents
    await Promise.all(
      agents.map(agent =>
        sendWebhook(agent.id, 'job.new_matching', {
          job_id: job.id,
          job_title: job.title,
          job_description: job.description,
          requirements: job.requirements,
          payment_sol: job.payment_sol,
        })
      )
    );

    console.log(`Notified ${agents.length} agents about new job: ${job.title}`);
  } catch (e) {
    console.error('Error notifying matching agents:', e);
  }
}
