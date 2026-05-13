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
      .select("provider, model, byok_api_key, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return {
      provider: (data?.provider ?? "managed") as AiProvider,
      model: data?.model ?? null,
      hasByokKey: !!data?.byok_api_key,
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
    const row: Record<string, unknown> = {
      user_id: userId,
      provider: data.provider,
      model: data.model ?? null,
    };
    if (data.byokApiKey !== undefined) {
      row.byok_api_key = data.byokApiKey;
    }
    const { error } = await supabase
      .from("user_ai_settings")
      .upsert(row, { onConflict: "user_id" });
    if (error) throw error;
    return { ok: true };
  });
