import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { events as eventsList, eventDate, eventLink } from "@/lib/events-data";
import {
  createCalendarEventWithMeet,
  addAttendeeToEvent,
  removeAttendeeFromEvent,
  extractMeetLink,
} from "@/lib/google-calendar.server";
import { getCurrentPeriodBounds, getEventQuota } from "@/lib/entitlements";
import { TIER_BY_PRICE, type Tier } from "@/hooks/useSubscription";
import { enqueueTemplateEmail } from "@/lib/email/enqueue.server";
import { notifyNextWaitlisted } from "@/lib/event-waitlist.functions";

const rsvpInput = z.object({ eventId: z.number().int().positive() });
const CALENDAR_ID = "primary";

function periodKey(period: "month" | "year", now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  if (period === "year") return String(y);
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function tierLabel(t: Tier): string {
  return t === "free" ? "Free" : t.charAt(0).toUpperCase() + t.slice(1);
}

async function logEnforcement(opts: {
  userId: string;
  decision: "allow" | "deny" | "waitlist";
  reason?: string;
  tier: Tier;
  used: number;
  limit: number | null;
  eventId: number;
}) {
  const { startISO, endISO, period } = getCurrentPeriodBounds(opts.tier);
  await supabaseAdmin.from("quota_enforcement_log").insert({
    user_id: opts.userId,
    decision: opts.decision,
    reason: opts.reason ?? null,
    tier: opts.tier,
    period,
    period_start: startISO,
    period_end: endISO,
    used: opts.used,
    quota_limit: opts.limit,
    event_id: opts.eventId,
  });
}

async function maybeQuotaNotify(opts: {
  userId: string;
  email: string;
  tier: Tier;
  used: number;
  limit: number;
}) {
  const remaining = Math.max(0, opts.limit - opts.used);
  let kind: "last_slot" | "exhausted" | null = null;
  if (remaining === 0) kind = "exhausted";
  else if (remaining === 1) kind = "last_slot";
  if (!kind) return;
  const { period } = getCurrentPeriodBounds(opts.tier);
  const pkey = periodKey(period);
  // dedupe via unique (user_id, kind, period_key)
  const { error: dedupeErr } = await supabaseAdmin
    .from("quota_notification_log")
    .insert({ user_id: opts.userId, kind, period_key: pkey, tier: opts.tier });
  if (dedupeErr) return; // already sent
  await Promise.allSettled([
    enqueueTemplateEmail({
      templateName: "quota-notification",
      recipient: opts.email,
      data: {
        kind,
        tierLabel: tierLabel(opts.tier),
        period,
        limit: opts.limit,
        remaining,
      },
      idempotencyKey: `quota-${kind}-${opts.userId}-${pkey}`,
    }),
    supabaseAdmin.from("user_notifications").insert({
      user_id: opts.userId,
      kind: `quota_${kind}`,
      title: kind === "exhausted" ? "You've used all your event RSVPs" : "1 event RSVP left this " + period,
      body:
        kind === "exhausted"
          ? "Upgrade to Champion or Team for unlimited RSVPs, or join an event's waitlist."
          : "Pick the executive session that matters most before the period resets.",
      metadata: { tier: opts.tier, period, limit: opts.limit, remaining },
    }),
  ]);
}



function detectEnv(): "sandbox" | "live" {
  const token = process.env.VITE_PAYMENTS_CLIENT_TOKEN ?? "";
  return token.startsWith("pk_test_") ? "sandbox" : "live";
}

async function resolveUserTier(userId: string): Promise<Tier> {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("tier_id,price_id,status,current_period_end")
    .eq("user_id", userId)
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

async function countUserRsvpsInPeriod(userId: string, tier: Tier): Promise<number> {
  const { startISO, endISO } = getCurrentPeriodBounds(tier);
  const { count } = await supabaseAdmin
    .from("event_rsvps")
    .select("event_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startISO)
    .lt("created_at", endISO);
  return count ?? 0;
}



// Default 90 minutes if no end time defined
function endISOFor(startISO: string): string {
  return new Date(new Date(startISO).getTime() + 90 * 60 * 1000).toISOString();
}

async function ensureMeetForEvent(eventId: number): Promise<{
  google_event_id: string;
  meet_link: string | null;
  html_link: string | null;
}> {
  const { data: existing } = await supabaseAdmin
    .from("event_meet_links")
    .select("google_event_id, meet_link, html_link")
    .eq("event_id", eventId)
    .maybeSingle();
  if (existing?.google_event_id) {
    return {
      google_event_id: existing.google_event_id,
      meet_link: existing.meet_link ?? null,
      html_link: existing.html_link ?? null,
    };
  }
  const event = eventsList.find((e) => e.id === eventId);
  if (!event) throw new Error("Event not found");
  const startISO = eventDate(event).toISOString();
  const endISO = endISOFor(startISO);
  const publicUrl = eventLink(event);
  const created = await createCalendarEventWithMeet({
    calendarId: CALENDAR_ID,
    summary: event.title,
    description: `${event.subtitle}\n\nSpeaker: ${event.speaker}\nAudience: ${event.audience}\n\nEvent page: ${publicUrl}`,
    location: event.location,
    startISO,
    endISO,
    timeZone: "Europe/Paris",
    sourceUrl: publicUrl,
    sourceTitle: event.title,
  });
  const meet_link = extractMeetLink(created) ?? null;
  const html_link = created.htmlLink ?? null;
  const { error } = await supabaseAdmin.from("event_meet_links").upsert(
    {
      event_id: eventId,
      calendar_id: CALENDAR_ID,
      google_event_id: created.id,
      meet_link,
      html_link,
    },
    { onConflict: "event_id" }
  );
  if (error) throw new Error(error.message);
  return { google_event_id: created.id, meet_link, html_link };
}

export const rsvpToEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => rsvpInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const event = eventsList.find((e) => e.id === data.eventId);
    if (!event) throw new Error("Event not found");
    const email = (claims as { email?: string }).email;
    if (!email) throw new Error("No email on account");

    // Enforce per-tier event quota. Re-RSVPing to an event the user is
    // already on does NOT consume a new slot (upsert is idempotent).
    const tier = await resolveUserTier(userId);
    const quota = getEventQuota(tier);
    let usedNow = 0;
    if (quota.limit !== null) {
      const { data: existing } = await supabaseAdmin
        .from("event_rsvps")
        .select("event_id")
        .eq("user_id", userId)
        .eq("event_id", data.eventId)
        .maybeSingle();
      usedNow = await countUserRsvpsInPeriod(userId, tier);
      if (!existing && usedNow >= quota.limit) {
        await logEnforcement({
          userId,
          decision: "deny",
          reason: "quota_exhausted",
          tier,
          used: usedNow,
          limit: quota.limit,
          eventId: data.eventId,
        });
        throw new Error(
          `You've used all ${quota.limit} event RSVPs for this ${quota.period}. Join the waitlist or upgrade your plan.`,
        );
      }
    }

    const { error } = await supabase.from("event_rsvps").upsert(
      {
        user_id: userId,
        event_id: event.id,
        email,
        event_title: event.title,
        event_starts_at: eventDate(event).toISOString(),
        event_location: event.location,
        event_href: event.href,
      },
      { onConflict: "user_id,event_id" }
    );
    if (error) throw new Error(error.message);

    await logEnforcement({
      userId,
      decision: "allow",
      tier,
      used: usedNow + 1,
      limit: quota.limit,
      eventId: data.eventId,
    });

    // If this RSVP brought them to 1 left or 0 left, notify (deduped per period).
    if (quota.limit !== null) {
      await maybeQuotaNotify({
        userId,
        email,
        tier,
        used: usedNow + 1,
        limit: quota.limit,
      });
    }

    // If user was on the waitlist for this event, clear it.
    await supabaseAdmin
      .from("event_waitlist")
      .update({ converted_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("event_id", event.id)
      .is("converted_at", null);




    // Best-effort calendar invite + Meet link. Never break RSVP if Calendar fails.
    let meet_link: string | null = null;
    try {
      const meet = await ensureMeetForEvent(event.id);
      meet_link = meet.meet_link;
      try {
        const displayName = (claims as { name?: string; user_metadata?: { full_name?: string } })
          .user_metadata?.full_name;
        await addAttendeeToEvent({
          calendarId: CALENDAR_ID,
          eventId: meet.google_event_id,
          email,
          displayName,
        });
      } catch (err) {
        console.error("[rsvp] addAttendee failed", err);
      }
    } catch (err) {
      console.error("[rsvp] ensureMeetForEvent failed", err);
    }
    return { ok: true, meet_link };
  });

export const cancelRsvp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => rsvpInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const { error } = await supabase
      .from("event_rsvps")
      .delete()
      .eq("user_id", userId)
      .eq("event_id", data.eventId);
    if (error) throw new Error(error.message);

    const email = (claims as { email?: string }).email;
    if (email) {
      const { data: link } = await supabaseAdmin
        .from("event_meet_links")
        .select("google_event_id, calendar_id")
        .eq("event_id", data.eventId)
        .maybeSingle();
      if (link?.google_event_id) {
        try {
          await removeAttendeeFromEvent({
            calendarId: link.calendar_id ?? CALENDAR_ID,
            eventId: link.google_event_id,
            email,
          });
        } catch (err) {
          console.error("[rsvp] removeAttendee failed", err);
        }
      }
    }
    // A spot just opened — tell the next waitlisted user (best-effort).
    try {
      await notifyNextWaitlisted(data.eventId);
    } catch (err) {
      console.error("[rsvp] notifyNextWaitlisted failed", err);
    }
    return { ok: true };
  });

export const listMyRsvps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("event_rsvps")
      .select("event_id")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    const eventIds = (data ?? []).map((r) => r.event_id as number);
    if (eventIds.length === 0) return { eventIds, meetLinks: {} as Record<number, string> };
    const { data: links } = await supabaseAdmin
      .from("event_meet_links")
      .select("event_id, meet_link")
      .in("event_id", eventIds);
    const meetLinks: Record<number, string> = {};
    for (const l of links ?? []) {
      if (l.meet_link) meetLinks[l.event_id as number] = l.meet_link;
    }
    return { eventIds, meetLinks };
  });

export const getEventQuotaStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const tier = await resolveUserTier(userId);
    const quota = getEventQuota(tier);
    const used = quota.limit === null ? 0 : await countUserRsvpsInPeriod(userId, tier);
    const { endISO, period } = getCurrentPeriodBounds(tier);
    return {
      tier,
      limit: quota.limit,
      period,
      used,
      remaining: quota.limit === null ? null : Math.max(0, quota.limit - used),
      resetsAt: endISO,
    };
  });

