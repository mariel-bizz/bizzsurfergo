import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  environment: string;
}

export interface SubscriptionState {
  loading: boolean;
  subscription: SubscriptionRow | null;
  isActive: boolean;
  tier: "free" | "hero" | "champion";
}

const TIER_BY_PRICE: Record<string, "hero" | "champion"> = {
  hero_monthly: "hero",
  hero_yearly: "hero",
  champion_monthly: "champion",
  champion_yearly: "champion",
};

function computeIsActive(sub: SubscriptionRow | null): boolean {
  if (!sub) return false;
  const end = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null;
  const future = end === null || end > Date.now();
  if (["active", "trialing", "past_due"].includes(sub.status) && future) return true;
  if (sub.status === "canceled" && end !== null && end > Date.now()) return true;
  return false;
}

export function useSubscription(userId: string | null | undefined): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    loading: true,
    subscription: null,
    isActive: false,
    tier: "free",
  });

  useEffect(() => {
    if (!userId) {
      setState({ loading: false, subscription: null, isActive: false, tier: "free" });
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
      const tier: "free" | "hero" | "champion" =
        active && sub ? (TIER_BY_PRICE[sub.price_id] ?? "free") : "free";
      setState({ loading: false, subscription: sub, isActive: active, tier });
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
