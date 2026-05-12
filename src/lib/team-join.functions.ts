import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const requestTeamJoin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ owner_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const email = ((claims as { email?: string }).email ?? "").toLowerCase();
    if (!email) throw new Error("Your account has no email on file.");
    if (data.owner_id === userId) {
      throw new Error("You can't join your own team.");
    }
    // Verify owner exists
    const { data: ownerUser, error: ownerErr } =
      await supabaseAdmin.auth.admin.getUserById(data.owner_id);
    if (ownerErr || !ownerUser?.user) {
      throw new Error("This team link is no longer valid.");
    }
    const { data: row, error } = await supabaseAdmin
      .from("team_members")
      .upsert(
        {
          owner_id: data.owner_id,
          email,
          name: (claims as { user_metadata?: { full_name?: string } }).user_metadata?.full_name ?? null,
          role: "member",
          status: "active",
          accepted_at: new Date().toISOString(),
        },
        { onConflict: "owner_id,email" },
      )
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id as string };
  });
