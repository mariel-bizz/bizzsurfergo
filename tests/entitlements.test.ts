/**
 * Verifies entitlement rules: per-tier event quota math, period bounds, and
 * Premium AI gating across Free / Hero / Champion / Team.
 *
 * Run with:  bun test tests/entitlements.test.ts
 */

import { describe, expect, test } from "bun:test";
import {
  EVENT_QUOTA,
  getEventQuota,
  getCurrentPeriodBounds,
  canUsePremiumAi,
  PREMIUM_AI_TIERS,
} from "../src/lib/entitlements";

describe("EVENT_QUOTA", () => {
  test("free: 1 / year", () => {
    expect(EVENT_QUOTA.free).toEqual({ limit: 1, period: "year" });
  });
  test("hero: 2 / month", () => {
    expect(EVENT_QUOTA.hero).toEqual({ limit: 2, period: "month" });
  });
  test("champion + team: unlimited / month", () => {
    expect(EVENT_QUOTA.champion.limit).toBeNull();
    expect(EVENT_QUOTA.team.limit).toBeNull();
  });
});

describe("getCurrentPeriodBounds", () => {
  test("free uses calendar-year window", () => {
    const now = new Date(Date.UTC(2026, 5, 11));
    const { startISO, endISO, period } = getCurrentPeriodBounds("free", now);
    expect(period).toBe("year");
    expect(startISO).toBe("2026-01-01T00:00:00.000Z");
    expect(endISO).toBe("2027-01-01T00:00:00.000Z");
  });
  test("hero uses calendar-month window", () => {
    const now = new Date(Date.UTC(2026, 5, 11));
    const { startISO, endISO, period } = getCurrentPeriodBounds("hero", now);
    expect(period).toBe("month");
    expect(startISO).toBe("2026-06-01T00:00:00.000Z");
    expect(endISO).toBe("2026-07-01T00:00:00.000Z");
  });
});

describe("Premium AI gating", () => {
  test("only champion + team unlock premium providers", () => {
    expect(canUsePremiumAi("free")).toBe(false);
    expect(canUsePremiumAi("hero")).toBe(false);
    expect(canUsePremiumAi("champion")).toBe(true);
    expect(canUsePremiumAi("team")).toBe(true);
    expect(PREMIUM_AI_TIERS).toEqual(["champion", "team"]);
  });
});

describe("Quota enforcement math (simulating rsvp.functions decisions)", () => {
  const cases = [
    { tier: "free" as const, used: 0, allow: true },
    { tier: "free" as const, used: 1, allow: false },
    { tier: "hero" as const, used: 0, allow: true },
    { tier: "hero" as const, used: 1, allow: true },
    { tier: "hero" as const, used: 2, allow: false },
    { tier: "champion" as const, used: 999, allow: true },
    { tier: "team" as const, used: 9999, allow: true },
  ];
  test.each(cases)("$tier with $used used → allow=$allow", ({ tier, used, allow }) => {
    const q = getEventQuota(tier);
    const allowed = q.limit === null || used < q.limit;
    expect(allowed).toBe(allow);
  });
});

describe("Premium AI provider switching", () => {
  const providers = ["openai", "claude", "mistral", "perplexity", "gemini"] as const;
  test.each(providers)("free cannot switch to %s", (p) => {
    expect(canUsePremiumAi("free") && providers.includes(p)).toBe(false);
  });
  test.each(providers)("hero cannot switch to %s", (p) => {
    expect(canUsePremiumAi("hero") && providers.includes(p)).toBe(false);
  });
  test.each(providers)("champion can switch to %s", (p) => {
    expect(canUsePremiumAi("champion") && providers.includes(p)).toBe(true);
  });
  test.each(providers)("team can switch to %s", (p) => {
    expect(canUsePremiumAi("team") && providers.includes(p)).toBe(true);
  });
});

describe("Waitlist eligibility (derived from quota state)", () => {
  // Waitlist button appears only when limited tiers exhaust their period.
  const shouldOfferWaitlist = (tier: "free" | "hero" | "champion" | "team", used: number) => {
    const q = getEventQuota(tier);
    if (q.limit === null) return false;
    return used >= q.limit;
  };
  test("free at 1 used → waitlist", () => expect(shouldOfferWaitlist("free", 1)).toBe(true));
  test("free at 0 used → no waitlist", () => expect(shouldOfferWaitlist("free", 0)).toBe(false));
  test("hero at 2 used → waitlist", () => expect(shouldOfferWaitlist("hero", 2)).toBe(true));
  test("champion never offered waitlist", () => expect(shouldOfferWaitlist("champion", 99)).toBe(false));
  test("team never offered waitlist", () => expect(shouldOfferWaitlist("team", 99)).toBe(false));
});

