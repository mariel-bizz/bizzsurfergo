// Central entitlement rules per pricing tier.
// Mirrors src/components/pricing/PricingComparisonTable.tsx — keep in sync.

import type { Tier } from "@/hooks/useSubscription";
import type { Provider } from "@/components/chat/GoChatSetup";

export type QuotaPeriod = "month" | "year";

export interface EventQuota {
  limit: number | null; // null = unlimited
  period: QuotaPeriod;
}

// Free/Go: 1 / year — Hero: 2 / month — Champion & Team: unlimited.
export const EVENT_QUOTA: Record<Tier, EventQuota> = {
  free: { limit: 1, period: "year" },
  hero: { limit: 2, period: "month" },
  champion: { limit: null, period: "month" },
  team: { limit: null, period: "month" },
};

export function getEventQuota(tier: Tier): EventQuota {
  return EVENT_QUOTA[tier] ?? EVENT_QUOTA.free;
}

// Returns the [start, end) ISO timestamps for the current quota period.
export function getCurrentPeriodBounds(tier: Tier, now: Date = new Date()): { startISO: string; endISO: string; period: QuotaPeriod } {
  const { period } = getEventQuota(tier);
  if (period === "year") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));
    return { startISO: start.toISOString(), endISO: end.toISOString(), period };
  }
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { startISO: start.toISOString(), endISO: end.toISOString(), period };
}

// Premium AI providers are gated to Champion and Team.
export const PREMIUM_AI_PROVIDERS: Provider[] = ["openai", "claude", "mistral", "perplexity", "gemini"];
export const PREMIUM_AI_TIERS: Tier[] = ["champion", "team"];

export function canUsePremiumAi(tier: Tier): boolean {
  return PREMIUM_AI_TIERS.includes(tier);
}
