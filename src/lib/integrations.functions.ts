import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type IntegrationRow = {
  id: string;
  user_id: string;
  category: string;
  provider: string;
  display_name: string | null;
  config: Record<string, unknown>;
  status: "connected" | "disconnected" | "error";
  health: "healthy" | "degraded" | "down";
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

const upsertInput = z.object({
  category: z.string().min(1).max(60),
  provider: z.string().min(1).max(80),
  display_name: z.string().min(1).max(120).optional(),
  config: z
    .object({
      base_url: z.string().url().max(500).optional(),
      api_key: z.string().min(1).max(500).optional(),
      account_id: z.string().max(200).optional(),
      workspace: z.string().max(200).optional(),
      notes: z.string().max(1000).optional(),
    })
    .strict(),
});

const idInput = z.object({ id: z.string().uuid() });

function maskConfig(config: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...config };
  if (typeof out.api_key === "string" && out.api_key.length > 0) {
    const k = out.api_key as string;
    out.api_key = `••••${k.slice(-4)}`;
  }
  return out;
}

export const listMyIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_integrations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as IntegrationRow[];
    return {
      integrations: rows.map((r) => ({ ...r, config: maskConfig(r.config ?? {}) })),
    };
  });

export const upsertIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => upsertInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("user_integrations")
      .upsert(
        {
          user_id: userId,
          category: data.category,
          provider: data.provider,
          display_name: data.display_name ?? data.provider,
          config: data.config,
          status: "connected",
          health: "healthy",
          last_sync_at: new Date().toISOString(),
          last_error: null,
        },
        { onConflict: "user_id,provider" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const syncIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Stub sync: in prod, would call provider API. Mark healthy + bump last_sync_at.
    const ok = Math.random() > 0.1;
    const { error } = await supabase
      .from("user_integrations")
      .update({
        last_sync_at: new Date().toISOString(),
        health: ok ? "healthy" : "degraded",
        status: "connected",
        last_error: ok ? null : "Sync warning: partial response",
      })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok };
  });

export const disconnectIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("user_integrations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
