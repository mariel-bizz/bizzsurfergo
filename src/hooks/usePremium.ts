import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "./useSubscription";

export interface PremiumState {
  loading: boolean;
  authed: boolean;
  userId: string | null;
  isPremium: boolean;
  tier: "free" | "hero" | "champion";
}

/**
 * Shared premium-plan check. Resolves the current user, then resolves their
 * subscription. Use everywhere we gate a feature on Premium so behavior stays
 * consistent across upgrade dialogs and protected routes.
 */
export function usePremium(): PremiumState {
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUserId(data.user?.id ?? null);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
      setAuthChecked(true);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const { loading, isActive, tier } = useSubscription(userId);

  return {
    loading: !authChecked || (!!userId && loading),
    authed: !!userId,
    userId,
    isPremium: isActive,
    tier,
  };
}
