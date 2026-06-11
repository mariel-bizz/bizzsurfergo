import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getCurrentPeriodBounds, getEventQuota } from "@/lib/entitlements";
import { TIER_BY_PRICE, type Tier } from "@/hooks/useSubscription";

async function requireAdmin(userId: string) {
  const { data } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

function detectEnv(): "sandbox" | "live" {
  const token = process.env.VITE_PAYMENTS_CLIENT_TOKEN ?? "";
  return token.startsWith("pk_test_") ? "sandbox" : "live";
}

async function resolveTier(uid: string): Promise<Tier> {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("tier_id,price_id,status,current_period_end")
    .eq("user_id", uid)
    .eq("environment", detectEnv())
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

export const listQuotaAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ limit: z.number().int().positive().max(200).default(50) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);

    // Pull recent enforcement rows to get a unique user set.
    const { data: enforcement } = await supabaseAdmin
      .from("quota_enforcement_log")
      .select("user_id,decision,reason,tier,period,period_start,period_end,used,quota_limit,event_id,created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit * 4);

    const userIds = Array.from(new Set((enforcement ?? []).map((r) => r.user_id))).slice(0, data.limit);

    const rows: Array<{
      userId: string;
      email: string | null;
      tier: Tier;
      period: "month" | "year";
      periodStart: string;
      periodEnd: string;
      used: number;
      limit: number | null;
      recentDecisions: typeof enforcement;
    }> = [];

    for (const uid of userIds) {
      const tier = await resolveTier(uid);
      const quota = getEventQuota(tier);
      const { startISO, endISO, period } = getCurrentPeriodBounds(tier);
      const { count } = await supabaseAdmin
        .from("event_rsvps")
        .select("event_id", { count: "exact", head: true })
        .eq("user_id", uid)
        .gte("created_at", startISO)
        .lt("created_at", endISO);
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(uid);
      rows.push({
        userId: uid,
        email: u?.user?.email ?? null,
        tier,
        period,
        periodStart: startISO,
        periodEnd: endISO,
        used: count ?? 0,
        limit: quota.limit,
        recentDecisions: (enforcement ?? []).filter((r) => r.user_id === uid).slice(0, 5),
      });
    }
    return { rows };
  });
