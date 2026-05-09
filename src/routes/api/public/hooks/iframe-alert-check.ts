import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { dispatchAlertNotifications } from "@/lib/alert-notify.server";
import type { Database } from "@/integrations/supabase/types";

// Configurable thresholds
const WINDOW_MINUTES = 15;
const MIN_SAMPLE = 5; // require at least N events to evaluate
const FAILURE_RATE_THRESHOLD = 0.5; // 50% failures triggers an alert
const COOLDOWN_MINUTES = 60; // don't re-alert if a same-kind alert exists in this window

const ALERT_KIND = "iframe_failure_rate";

export const Route = createFileRoute("/api/public/hooks/iframe-alert-check")({
  server: {
    handlers: {
      POST: async ({ request }) => authorize(request) ?? runCheck(),
      GET: async ({ request }) => authorize(request) ?? runCheck(),
    },
  },
});

async function authorize(request: Request): Promise<Response | undefined> {
  // Option 1: shared cron secret (preferred for scheduled callers)
  const cronSecret = process.env.IFRAME_ALERT_CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");
  if (cronSecret && provided && timingSafeEqualStr(provided, cronSecret)) {
    return undefined;
  }

  // Option 2: authenticated admin user (Bearer JWT + has_role admin)
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = auth.slice("Bearer ".length).trim();
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return new Response("Server misconfigured", { status: 500 });
  }
  const sb = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data: claimsData, error: claimsErr } = await sb.auth.getClaims(token);
  const userId = claimsData?.claims?.sub;
  if (claimsErr || !userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { data: isAdmin, error: roleErr } = await sb.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (roleErr || !isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }
  return undefined;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function runCheck(): Promise<Response> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();

  const { data: events, error } = await supabaseAdmin
    .from("outbound_clicks")
    .select("path, created_at")
    .eq("source", "resources_iframe")
    .gte("created_at", since);

  if (error) {
    console.error("[iframe-alert-check] query failed", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  const total = events?.length ?? 0;
  let loaded = 0,
    errors = 0,
    timeouts = 0;
  for (const e of events ?? []) {
    const evt = (e.path ?? "").split("?")[0];
    if (evt === "loaded") loaded++;
    else if (evt === "error") errors++;
    else if (evt === "timeout") timeouts++;
  }
  const attempts = loaded + errors + timeouts;
  const failures = errors + timeouts;
  const rate = attempts > 0 ? failures / attempts : 0;

  const summary = {
    window_minutes: WINDOW_MINUTES,
    attempts,
    loaded,
    errors,
    timeouts,
    failure_rate: Number(rate.toFixed(3)),
    threshold: FAILURE_RATE_THRESHOLD,
  };

  if (attempts < MIN_SAMPLE || rate < FAILURE_RATE_THRESHOLD) {
    return Response.json({ ok: true, alerted: false, ...summary });
  }

  // Cooldown: skip if recent unacknowledged alert of same kind exists
  const cooldownSince = new Date(Date.now() - COOLDOWN_MINUTES * 60_000).toISOString();
  const { data: recent } = await supabaseAdmin
    .from("admin_alerts")
    .select("id")
    .eq("kind", ALERT_KIND)
    .gte("created_at", cooldownSince)
    .limit(1);

  if (recent && recent.length > 0) {
    return Response.json({ ok: true, alerted: false, reason: "cooldown", ...summary });
  }

  const pct = Math.round(rate * 100);
  const severity: "warning" | "critical" = rate >= 0.8 ? "critical" : "warning";
  const alert = {
    kind: ALERT_KIND,
    severity,
    title: `Insights iframe failing (${pct}% of last ${WINDOW_MINUTES}m)`,
    message: `${failures}/${attempts} loads failed in the past ${WINDOW_MINUTES} minutes (${errors} errors, ${timeouts} timeouts). Threshold ${Math.round(FAILURE_RATE_THRESHOLD * 100)}%.`,
    metadata: summary as Record<string, unknown>,
  };

  const { error: insertError } = await supabaseAdmin
    .from("admin_alerts")
    .insert({ ...alert, metadata: alert.metadata as never });
  if (insertError) {
    console.error("[iframe-alert-check] insert failed", insertError);
    return Response.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  // Fan out to email / Slack / webhook. Failures are logged but never block the alert.
  const notifications = await dispatchAlertNotifications(alert);
  console.log("[iframe-alert-check] notifications", notifications);

  return Response.json({ ok: true, alerted: true, notifications, ...summary });
}
