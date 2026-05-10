import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { events as eventsList, eventDate } from "@/lib/events-data";
import {
  createCalendarEventWithMeet,
  addAttendeeToEvent,
  removeAttendeeFromEvent,
  extractMeetLink,
} from "@/lib/google-calendar.server";

const rsvpInput = z.object({ eventId: z.number().int().positive() });
const CALENDAR_ID = "primary";

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
  const created = await createCalendarEventWithMeet({
    calendarId: CALENDAR_ID,
    summary: event.title,
    description: `${event.subtitle}\n\nSpeaker: ${event.speaker}\nAudience: ${event.audience}`,
    location: event.location,
    startISO,
    endISO,
    timeZone: "Europe/Paris",
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
