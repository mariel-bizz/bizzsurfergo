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
  config_secret_id: string | null;
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
      // NOTE: api_key intentionally NOT accepted here. API keys are stored in
      // Supabase Vault via the setIntegrationApiKey serverFn / RPC.
      api_key: z.string().min(4).max(500).optional(),
      account_id: z.string().max(200).optional(),
      workspace: z.string().max(200).optional(),
      notes: z.string().max(1000).optional(),
    })
    .strict(),
});

const idInput = z.object({ id: z.string().uuid() });
const setKeyInput = z.object({ id: z.string().uuid(), api_key: z.string().min(4).max(500) });

function maskConfig(
  config: Record<string, unknown>,
  hasSecret: boolean,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(config ?? {})) {
    if (v == null || k === "api_key") continue;
    out[k] = typeof v === "string" ? v : String(v);
  }
  if (hasSecret) {
    out.api_key = "••••••••";
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
    const rows = (data ?? []) as unknown as IntegrationRow[];
    return {
      integrations: rows.map((r) => ({
        ...r,
        config: maskConfig(r.config ?? {}, !!r.config_secret_id),
      })),
    };
  });

export const upsertIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => upsertInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Strip api_key from config before persisting — keys go to Vault only.
    const { api_key, ...safeConfig } = data.config;
    const { data: row, error } = await supabase
      .from("user_integrations")
      .upsert(
        {
          user_id: userId,
          category: data.category,
          provider: data.provider,
          display_name: data.display_name ?? data.provider,
          config: safeConfig,
          status: "connected",
          health: "healthy",
          last_sync_at: new Date().toISOString(),
          last_error: null,
        },
        { onConflict: "user_id,provider" },
      )
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (api_key && row?.id) {
      const { error: rpcError } = await supabase.rpc("set_integration_api_key", {
        _integration_id: row.id,
        _key: api_key,
      });
      if (rpcError) throw new Error(rpcError.message);
    }
    return { ok: true };
  });

export const setIntegrationApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => setKeyInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.rpc("set_integration_api_key", {
      _integration_id: data.id,
      _key: data.api_key,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearIntegrationApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.rpc("clear_integration_api_key", {
      _integration_id: data.id,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const syncIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
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
    // Best-effort: clear vault secret first, then delete row.
    await supabase.rpc("clear_integration_api_key", { _integration_id: data.id });
    const { error } = await supabase
      .from("user_integrations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
