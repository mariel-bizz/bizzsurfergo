import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  // base64 (no data URL prefix) OR full data URL
  audioBase64: z.string().min(10).max(15_000_000),
  mimeType: z.string().min(3).max(100).default("audio/webm"),
});

function stripDataUrl(s: string): { data: string; mime?: string } {
  const m = s.match(/^data:([^;]+);base64,(.+)$/);
  if (m) return { mime: m[1], data: m[2] };
  return { data: s };
}

export const transcribeChatAudio = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { data: b64, mime } = stripDataUrl(data.audioBase64);
    const mimeType = mime || data.mimeType;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transcribe this audio verbatim. Reply with only the transcription text, no preamble.",
              },
              {
                type: "input_audio",
                input_audio: { data: b64, format: mimeType.includes("mp4") ? "mp4" : "webm" },
              },
            ],
          },
        ],
      }),
    });

    if (resp.status === 429) throw new Error("Rate limit reached. Try again shortly.");
    if (resp.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      throw new Error(`Transcription failed (${resp.status}): ${t.slice(0, 200)}`);
    }

    const json = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("No transcript returned");
    return { transcript: text };
  });
