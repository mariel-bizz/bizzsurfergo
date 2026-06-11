import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { events as eventsList, eventDate } from "@/lib/events-data";
import { enqueueTemplateEmail } from "@/lib/email/enqueue.server";

const eventInput = z.object({ eventId: z.number().int().positive() });

export const joinEventWaitlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => eventInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const email = (claims as { email?: string }).email;
    if (!email) throw new Error("No email on account");
    const event = eventsList.find((e) => e.id === data.eventId);
    if (!event) throw new Error("Event not found");

    const { error } = await supabaseAdmin.from("event_waitlist").upsert(
      { user_id: userId, event_id: data.eventId, email },
      { onConflict: "user_id,event_id" },
    );
    if (error) throw new Error(error.message);

    // Best-effort in-app notification ack.
    await supabaseAdmin.from("user_notifications").insert({
      user_id: userId,
      kind: "waitlist_joined",
      title: `You're on the waitlist`,
      body: `We'll email you when a spot opens for "${event.title}".`,
      metadata: { event_id: event.id },
    });
    return { ok: true };
  });

export const leaveEventWaitlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => eventInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { error } = await supabaseAdmin
      .from("event_waitlist")
      .delete()
      .eq("user_id", userId)
      .eq("event_id", data.eventId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyWaitlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: mine, error } = await supabaseAdmin
      .from("event_waitlist")
      .select("event_id, created_at, notified_at, converted_at")
      .eq("user_id", userId)
      .is("converted_at", null);
    if (error) throw new Error(error.message);
    const rows = mine ?? [];
    const eventIds = rows.map((r) => r.event_id as number);
    // Position = count of earlier non-converted entries +1 for this event.
    const details: Record<number, { position: number; total: number; notified: boolean }> = {};
    for (const r of rows) {
      const { data: all } = await supabaseAdmin
        .from("event_waitlist")
        .select("user_id, created_at")
        .eq("event_id", r.event_id)
        .is("converted_at", null)
        .order("created_at", { ascending: true });
      const list = all ?? [];
      const idx = list.findIndex((x) => x.user_id === userId);
      details[r.event_id as number] = {
        position: idx >= 0 ? idx + 1 : 1,
        total: list.length,
        notified: !!r.notified_at,
      };
    }
    return { eventIds, details };
  });

/** Notify just the head of the waitlist for an event (called after a cancellation). */
export async function notifyNextWaitlisted(eventId: number): Promise<void> {
  const event = eventsList.find((e) => e.id === eventId);
  if (!event) return;
  const { data: rows } = await supabaseAdmin
    .from("event_waitlist")
    .select("id,user_id,email")
    .eq("event_id", eventId)
    .is("notified_at", null)
    .is("converted_at", null)
    .order("created_at", { ascending: true })
    .limit(1);
  const row = rows?.[0];
  if (!row) return;
  await enqueueTemplateEmail({
    templateName: "event-waitlist-open",
    recipient: row.email,
    data: {
      eventTitle: event.title,
      eventDate: eventDate(event).toLocaleString(),
      rsvpUrl: `https://go.bizzsurfer.ai/events`,
    },
    idempotencyKey: `waitlist-open-${eventId}-${row.user_id}`,
  });
  await supabaseAdmin.from("user_notifications").insert({
    user_id: row.user_id,
    kind: "waitlist_open",
    title: `You're next — a spot opened for "${event.title}"`,
    body: `Confirm your RSVP now — seats are first-come, first-served.`,
    metadata: { event_id: eventId },
  });
  await supabaseAdmin
    .from("event_waitlist")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", row.id);
}

/**
 * Notify all waitlisted users for an event that a spot is open.
 * Admin-only: idempotent per user (sets notified_at).
 */
export const notifyEventWaitlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => eventInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    // Require admin
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const event = eventsList.find((e) => e.id === data.eventId);
    if (!event) throw new Error("Event not found");

    const { data: rows } = await supabaseAdmin
      .from("event_waitlist")
      .select("id,user_id,email,notified_at")
      .eq("event_id", data.eventId)
      .is("notified_at", null);

    let notified = 0;
    for (const row of rows ?? []) {
      await enqueueTemplateEmail({
        templateName: "event-waitlist-open",
        recipient: row.email,
        data: {
          eventTitle: event.title,
          eventDate: eventDate(event).toLocaleString(),
          rsvpUrl: `https://go.bizzsurfer.ai/events`,
        },
        idempotencyKey: `waitlist-open-${data.eventId}-${row.user_id}`,
      });
      await supabaseAdmin.from("user_notifications").insert({
        user_id: row.user_id,
        kind: "waitlist_open",
        title: `A spot opened for "${event.title}"`,
        body: `Confirm your RSVP now — seats are first-come, first-served.`,
        metadata: { event_id: event.id },
      });
      await supabaseAdmin
        .from("event_waitlist")
        .update({ notified_at: new Date().toISOString() })
        .eq("id", row.id);
      notified++;
    }
    return { ok: true, notified };
  });
