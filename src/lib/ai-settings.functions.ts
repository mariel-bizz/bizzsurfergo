import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ProviderSchema = z.enum([
  "managed",
  "openai",
  "anthropic",
  "google",
  "mistral",
  "perplexity",
]);

export type AiProvider = z.infer<typeof ProviderSchema>;

export const getAiSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_ai_settings")
      .select("provider, model, byok_secret_id, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return {
      provider: (data?.provider ?? "managed") as AiProvider,
      model: data?.model ?? null,
      hasByokKey: !!data?.byok_secret_id,
      updatedAt: data?.updated_at ?? null,
    };
  });

export const saveAiSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        provider: ProviderSchema,
        model: z.string().min(1).max(120).nullable().optional(),
        byokApiKey: z.string().min(8).max(400).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Upsert provider/model (no secret material here).
    const { error: upsertError } = await supabase
      .from("user_ai_settings")
      .upsert(
        { user_id: userId, provider: data.provider, model: data.model ?? null },
        { onConflict: "user_id" },
      );
    if (upsertError) throw upsertError;

    // Handle BYOK key separately via Vault-backed RPCs.
    if (data.byokApiKey === null) {
      const { error } = await supabase.rpc("clear_user_byok_key");
      if (error) throw error;
    } else if (typeof data.byokApiKey === "string" && data.byokApiKey.length > 0) {
      const { error } = await supabase.rpc("set_user_byok_key", { _key: data.byokApiKey });
      if (error) throw error;
    }
    return { ok: true };
  });
