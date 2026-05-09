import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AlertPayload = {
  kind: string;
  severity: "warning" | "critical";
  title: string;
  message: string;
  metadata: Record<string, unknown>;
};

type ChannelResult = { channel: string; ok: boolean; detail?: string };

export async function dispatchAlertNotifications(alert: AlertPayload): Promise<ChannelResult[]> {
  const results = await Promise.allSettled([
    notifySlack(alert),
    notifyWebhook(alert),
    notifyEmailAdmins(alert),
  ]);
  const labels = ["slack", "webhook", "email"];
  return results.map((r, i) => {
    if (r.status === "fulfilled") return { channel: labels[i], ...r.value };
    return { channel: labels[i], ok: false, detail: String(r.reason) };
  });
}

// ---------- Slack ----------

async function notifySlack(alert: AlertPayload): Promise<{ ok: boolean; detail?: string }> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const slackKey = process.env.SLACK_API_KEY;
  const channel = process.env.SLACK_ALERT_CHANNEL;
  if (!lovableKey || !slackKey) return { ok: false, detail: "slack_not_configured" };
  if (!channel) return { ok: false, detail: "missing_SLACK_ALERT_CHANNEL" };

  const emoji = alert.severity === "critical" ? ":rotating_light:" : ":warning:";
  const text = `${emoji} *${alert.title}*\n${alert.message}`;
  const res = await fetch("https://connector-gateway.lovable.dev/slack/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": slackKey,
    },
    body: JSON.stringify({
      channel,
      text,
      blocks: [
        { type: "section", text: { type: "mrkdwn", text } },
        {
          type: "context",
          elements: [
            { type: "mrkdwn", text: `*Severity:* ${alert.severity} · *Kind:* ${alert.kind}` },
          ],
        },
      ],
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.ok === false) {
    return { ok: false, detail: `slack ${res.status} ${JSON.stringify(json).slice(0, 200)}` };
  }
  return { ok: true };
}

// ---------- Generic webhook ----------

async function notifyWebhook(alert: AlertPayload): Promise<{ ok: boolean; detail?: string }> {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return { ok: false, detail: "webhook_not_configured" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...alert, source: "bizzsurfer-go", at: new Date().toISOString() }),
    });
    if (!res.ok) return { ok: false, detail: `webhook ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, detail: `webhook error: ${(e as Error).message}` };
  }
}

// ---------- Email (all admin users) ----------

async function notifyEmailAdmins(alert: AlertPayload): Promise<{ ok: boolean; detail?: string }> {
  // Get admin user_ids
  const { data: roles, error: rolesErr } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  if (rolesErr) return { ok: false, detail: rolesErr.message };
  if (!roles || roles.length === 0) return { ok: false, detail: "no_admins" };

  // Look up emails via admin auth API
  const emails: string[] = [];
  for (const r of roles) {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
    if (!error && data?.user?.email) emails.push(data.user.email);
  }
  if (emails.length === 0) return { ok: false, detail: "no_admin_emails" };

  // Try to enqueue via the Lovable email queue. Will silently no-op if email infra
  // isn't set up yet (no enqueue_email RPC / no domain).
  let sent = 0;
  for (const email of emails) {
    try {
      const { error } = await supabaseAdmin.rpc("enqueue_email" as never, {
        queue_name: "transactional_emails",
        payload: {
          template_name: "admin-alert",
          recipient_email: email,
          template_data: alert,
          idempotency_key: `admin-alert-${alert.kind}-${email}-${Date.now()}`,
        },
      } as never);
      if (!error) sent++;
    } catch {
      // Email infra not available — ignore.
    }
  }
  if (sent === 0) return { ok: false, detail: "email_infra_unavailable" };
  return { ok: true, detail: `queued ${sent}/${emails.length}` };
}
