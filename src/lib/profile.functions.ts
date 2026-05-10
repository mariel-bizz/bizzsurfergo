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
    const { error } = await supabase.from("team_members").upsert(
      {
        owner_id: userId,
        email: data.email.toLowerCase(),
        name: data.name ?? null,
        role: data.role,
        status: "pending",
      },
      { onConflict: "owner_id,email" },
    );
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
