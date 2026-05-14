import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function detectEnv(): "sandbox" | "live" {
  const token = process.env.VITE_PAYMENTS_CLIENT_TOKEN ?? "";
  return token.startsWith("pk_test_") ? "sandbox" : "live";
}

export const getPremiumStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const env = detectEnv();
    const { data } = await supabase
      .from("subscriptions")
      .select("status,current_period_end,price_id")
      .eq("user_id", userId)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return { isPremium: false };
    const end = data.current_period_end ? new Date(data.current_period_end).getTime() : null;
    const future = end === null || end > Date.now();
    const active =
      (["active", "trialing", "past_due"].includes(data.status) && future) ||
      (data.status === "canceled" && end !== null && end > Date.now());
    return { isPremium: !!active };
  });
