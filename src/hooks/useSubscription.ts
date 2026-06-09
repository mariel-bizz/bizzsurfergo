import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { trackEvent } from "@/lib/analytics";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  product_id: string;
  price_id: string;
  tier_id: string | null;
  quantity: number | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  environment: string;
}

export type Tier = "free" | "hero" | "champion" | "team";
export type BillingPeriod = "monthly" | "yearly" | null;

export interface SubscriptionState {
  loading: boolean;
  subscription: SubscriptionRow | null;
  isActive: boolean;
  tier: Tier;
  billingPeriod: BillingPeriod;
  quantity: number;
}

const TIER_BY_PRICE: Record<string, Exclude<Tier, "free">> = {
  hero_monthly: "hero",
  hero_yearly: "hero",
  champion_monthly: "champion",
  champion_yearly: "champion",
  team_monthly: "team",
  team_yearly: "team",
};

export function billingPeriodFromPriceId(priceId: string | null | undefined): BillingPeriod {
  if (!priceId) return null;
  if (priceId.endsWith("_yearly")) return "yearly";
  if (priceId.endsWith("_monthly")) return "monthly";
  return null;
}

function computeIsActive(sub: SubscriptionRow | null): boolean {
  if (!sub) return false;
  const end = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null;
  const future = end === null || end > Date.now();
  if (["active", "trialing", "past_due"].includes(sub.status) && future) return true;
  if (sub.status === "canceled" && end !== null && end > Date.now()) return true;
  return false;
}

const TIER_RANK: Record<string, number> = { free: 0, go: 0, hero: 1, champion: 2, team: 3 };

export function useSubscription(userId: string | null | undefined): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    loading: true,
    subscription: null,
    isActive: false,
    tier: "free",
    billingPeriod: null,
    quantity: 1,
  });
  // Snapshot of last-observed tier/period/seats so we can fire a single
  // analytics event when Stripe Billing Portal changes propagate via the
  // webhook → realtime → refetch path. Skipped on the first load.
  const prev = useRef<{ tier: Tier; billing: BillingPeriod; quantity: number } | null>(null);

  useEffect(() => {
    if (!userId) {
      setState({
        loading: false,
        subscription: null,
        isActive: false,
        tier: "free",
        billingPeriod: null,
        quantity: 1,
      });
      prev.current = null;
      return;
    }
    const env = getStripeEnvironment();
    let cancelled = false;

    const refetch = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      const sub = (data as SubscriptionRow | null) ?? null;
      const active = computeIsActive(sub);
      const tier: Tier = active && sub
        ? ((sub.tier_id as Tier) ?? TIER_BY_PRICE[sub.price_id] ?? "free")
        : "free";
      const billingPeriod = active ? billingPeriodFromPriceId(sub?.price_id) : null;
      const quantity = sub?.quantity ?? 1;

      // Diff against last snapshot and emit analytics only on actual change.
      const last = prev.current;
      if (last && (last.tier !== tier || last.billing !== billingPeriod || last.quantity !== quantity)) {
        const tierChanged = last.tier !== tier;
        const direction = tierChanged
          ? (TIER_RANK[tier] ?? 0) > (TIER_RANK[last.tier] ?? 0)
            ? "upgrade"
            : "downgrade"
          : last.billing !== billingPeriod
          ? "billing_period_change"
          : quantity > last.quantity
          ? "seats_increase"
          : "seats_decrease";
        trackEvent("subscription_changed", {
          direction,
          from_tier: last.tier,
          to_tier: tier,
          from_billing: last.billing,
          to_billing: billingPeriod,
          from_seats: last.quantity,
          to_seats: quantity,
          seat_delta: quantity - last.quantity,
        });
      }
      prev.current = { tier, billing: billingPeriod, quantity };

      setState({
        loading: false,
        subscription: sub,
        isActive: active,
        tier,
        billingPeriod,
        quantity,
      });
    };

    refetch();

    const channel = supabase
      .channel(`subscriptions:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` },
        () => refetch(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return state;
}
