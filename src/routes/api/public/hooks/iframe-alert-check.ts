import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { dispatchAlertNotifications } from "@/lib/alert-notify.server";

// Configurable thresholds
const WINDOW_MINUTES = 15;
const MIN_SAMPLE = 5; // require at least N events to evaluate
const FAILURE_RATE_THRESHOLD = 0.5; // 50% failures triggers an alert
const COOLDOWN_MINUTES = 60; // don't re-alert if a same-kind alert exists in this window

const ALERT_KIND = "iframe_failure_rate";

export const Route = createFileRoute("/api/public/hooks/iframe-alert-check")({
  server: {
    handlers: {
      POST: async () => runCheck(),
      GET: async () => runCheck(),
    },
  },
});

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
