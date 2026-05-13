import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const prefsInput = z.object({
  display_name: z.string().max(120).nullable().optional(),
  job_title: z.string().max(120).nullable().optional(),
  company: z.string().max(120).nullable().optional(),
  topics: z.array(z.string().min(1).max(60)).max(40).optional(),
  languages: z.array(z.string().min(2).max(10)).max(20).optional(),
  email_updates: z.boolean().optional(),
  event_reminders: z.boolean().optional(),
  insights_digest: z.boolean().optional(),
});

export const getMyPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      preferences: data,
      account: {
        id: userId,
        email: (claims as { email?: string }).email ?? null,
      },
    };
  });

export const upsertMyPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => prefsInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const teamInput = z.object({
  email: z.string().email().max(254),
  name: z.string().min(1).max(120).optional(),
  role: z.enum(["member", "admin"]).default("member"),
});

export const listMyTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("owner_id", userId)
      .order("invited_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { team: data ?? [] };
  });

export const inviteTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => teamInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("team_members")
      .upsert(
        {
          owner_id: userId,
          email: data.email.toLowerCase(),
          name: data.name ?? null,
          role: data.role,
          status: "pending",
        },
        { onConflict: "owner_id,email" },
      )
      .select("invite_token")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, invite_token: row.invite_token as string };
  });

export const updateTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        role: z.enum(["member", "admin"]).optional(),
        status: z.enum(["pending", "active", "revoked"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch: { updated_at: string; role?: string; status?: string } = {
      updated_at: new Date().toISOString(),
    };
    if (data.role) patch.role = data.role;
    if (data.status) patch.status = data.status;
    const { error } = await supabase
      .from("team_members")
      .update(patch)
      .eq("id", data.id)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Invite acceptance: caller must be signed in with the email matching the invite.
export const acceptTeamInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, claims } = context;
    const myEmail = ((claims as { email?: string }).email ?? "").toLowerCase();
    if (!myEmail) throw new Error("Your account has no email on file.");

    const { data: invite, error: lookupError } = await supabase.rpc(
      "get_team_invite",
      { _token: data.token },
    );
    if (lookupError) throw new Error(lookupError.message);
    const row = Array.isArray(invite) ? invite[0] : invite;
    if (!row) throw new Error("This invite link is no longer valid.");
    if (row.email.toLowerCase() !== myEmail) {
      throw new Error(
        `This invite was sent to ${row.email}. Sign in with that email to accept.`,
      );
    }
    if (row.status === "revoked") throw new Error("This invite was revoked.");

    const { error: updateError } = await supabase
      .from("team_members")
      .update({ status: "active", accepted_at: new Date().toISOString() })
      .eq("id", row.id);
    if (updateError) throw new Error(updateError.message);
    return { ok: true, invite: row };
  });

// Notification gating helper: returns whether a user opted in to a given kind.
// Called by reminder/digest dispatchers before sending.
export const canNotifyUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        kind: z.enum(["event_reminders", "insights_digest", "email_updates"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Always enforce caller's own identity — never trust a client-supplied user_id.
    const { data: prefs, error } = await supabase
      .from("user_preferences")
      .select("event_reminders, insights_digest, email_updates")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    // Defaults match the table defaults (true) when no preferences row exists yet.
    const allowed = prefs ? Boolean(prefs[data.kind]) : true;
    return { allowed };
  });
