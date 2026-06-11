/**
 * Cron route: sends a one-time "your event RSVPs just reset" email to every
 * user whose plan period rolled over and who hasn't yet been notified for the
 * current period. Dedupe is enforced by a UNIQUE (user_id, kind, period_key)
 * row in quota_notification_log inserted BEFORE sending.
 *
 * Auth: either X-Cron-Secret (QUOTA_RESET_CRON_SECRET, constant-time compare)
 * or admin JWT (Bearer + has_role admin).
 */
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enqueueTemplateEmail } from "@/lib/email/enqueue.server";
import { getCurrentPeriodBounds, getEventQuota } from "@/lib/entitlements";
import { TIER_BY_PRICE, type Tier } from "@/hooks/useSubscription";
import { timingSafeEqualStr } from "@/lib/timing-safe";

export const Route = createFileRoute("/api/public/hooks/quota-reset")({
  server: {
    handlers: {
      POST: async ({ request }) => (await authorize(request)) ?? run(),
      GET: async ({ request }) => (await authorize(request)) ?? run(),
    },
  },
});

async function authorize(request: Request): Promise<Response | undefined> {
  const cronSecret = process.env.QUOTA_RESET_CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");
  if (cronSecret && provided && timingSafeEqualStr(provided, cronSecret)) return undefined;

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
  const token = auth.slice("Bearer ".length).trim();
  const url = process.env.SUPABASE_URL;
  const pub = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !pub) return new Response("Misconfigured", { status: 500 });
  const userClient = createClient(url, pub, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: u } = await userClient.auth.getUser();
  if (!u?.user) return new Response("Unauthorized", { status: 401 });
  const { data: isAdmin } = await userClient.rpc("has_role", {
    _user_id: u.user.id,
    _role: "admin",
  });
  if (!isAdmin) return new Response("Forbidden", { status: 403 });
  return undefined;
}

function periodKey(period: "month" | "year", now = new Date()): string {
  const y = now.getUTCFullYear();
  if (period === "year") return String(y);
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function tierLabel(t: Tier): string {
  return t === "free" ? "Free" : t.charAt(0).toUpperCase() + t.slice(1);
}

async function resolveTier(userId: string): Promise<Tier> {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("tier_id,price_id,status,current_period_end")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return "free";
  const end = data.current_period_end ? new Date(data.current_period_end).getTime() : null;
  const future = end === null || end > Date.now();
  const active =
    (["active", "trialing", "past_due"].includes(data.status) && future) ||
    (data.status === "canceled" && end !== null && end > Date.now());
  if (!active) return "free";
  return ((data.tier_id as Tier) ?? TIER_BY_PRICE[data.price_id ?? ""] ?? "free") as Tier;
}

async function run(): Promise<Response> {
  // Only notify users who have an RSVP record (i.e. ever engaged with events).
  // This avoids spamming every signup.
  const { data: actives } = await supabaseAdmin
    .from("event_rsvps")
    .select("user_id, email")
    .order("created_at", { ascending: false })
    .limit(5000);
  const uniq = new Map<string, string>();
  for (const r of actives ?? []) {
    if (!uniq.has(r.user_id as string)) uniq.set(r.user_id as string, r.email as string);
  }

  let sent = 0;
  let skipped = 0;
  for (const [userId, email] of uniq.entries()) {
    const tier = await resolveTier(userId);
    const quota = getEventQuota(tier);
    if (quota.limit === null) {
      skipped++;
      continue;
    }
    const { period } = getCurrentPeriodBounds(tier);
    const pkey = periodKey(period);

    // Dedupe-by-insert. Fails silently if already sent this period.
    const { error: dedupeErr } = await supabaseAdmin
      .from("quota_notification_log")
      .insert({ user_id: userId, kind: "reset", period_key: pkey, tier });
    if (dedupeErr) {
      skipped++;
      continue;
    }

    await Promise.allSettled([
      enqueueTemplateEmail({
        templateName: "quota-notification",
        recipient: email,
        data: {
          kind: "reset",
          tierLabel: tierLabel(tier),
          period,
          limit: quota.limit,
          remaining: quota.limit,
        },
        idempotencyKey: `quota-reset-${userId}-${pkey}`,
      }),
      supabaseAdmin.from("user_notifications").insert({
        user_id: userId,
        kind: "quota_reset",
        title: `Your event RSVPs just reset for this ${period}`,
        body: `You have a fresh ${quota.limit} RSVP${quota.limit === 1 ? "" : "s"} — pick the next executive session.`,
        metadata: { tier, period, limit: quota.limit },
      }),
    ]);
    sent++;
  }
  return Response.json({ ok: true, sent, skipped, considered: uniq.size });
}
