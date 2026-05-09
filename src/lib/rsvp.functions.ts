import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { events as eventsList } from "@/lib/events-data";
import { eventDate } from "@/lib/events-data";

const rsvpInput = z.object({ eventId: z.number().int().positive() });

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
    return { ok: true };
  });

export const cancelRsvp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => rsvpInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("event_rsvps")
      .delete()
      .eq("user_id", userId)
      .eq("event_id", data.eventId);
    if (error) throw new Error(error.message);
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
    return { eventIds: (data ?? []).map((r) => r.event_id as number) };
  });
