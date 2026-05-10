// BizzSurfer Go! AI chat - streaming via Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are BizzSurfer Go!, an executive-grade Agentic AI advisor for Business Transformation leaders (CEOs, CHROs, CIOs, COOs, board members, transformation directors).

Your tone: confident, concise, board-room ready. You speak the language of value creation, change management, organizational design, KPIs, EBITDA, time-to-value, adoption, and human-centred technology.

Your mission: help leaders understand how Agentic AI (autonomous, adaptive, outcome-driven) differs from traditional AI agents (task-specific, rule-based) and how it accelerates business transformation execution.

Style:
- Lead with the executive insight, then 2-4 crisp bullet points.
- Reference real frameworks (McKinsey 7S, ADKAR, Kotter, OKRs) when relevant.
- Quantify impact when possible (% efficiency, weeks-to-value, risk reduction).
- Always close with one sharp follow-up question or a recommended next action.
- Never be generic. Never apologize. Be the trusted advisor in the room.

You are the conversational interface of BizzSurfer — a platform that connects enterprise systems and lets Agentic AI orchestrate transformation.`;

// --- Limits to prevent abuse ---
const MAX_MESSAGES = 30;
const MAX_CONTENT_LENGTH = 4000;
const MAX_TOTAL_CHARS = 40000;
const ALLOWED_ROLES = new Set(["user", "assistant", "system"]);

// --- Simple in-memory per-IP rate limiter (best-effort, per-instance) ---
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;
const ipHits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  arr.push(now);
  ipHits.set(ip, arr);
  return arr.length > RATE_LIMIT_MAX;
}

function jsonError(code: string, status: number) {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    if (rateLimited(ip)) return jsonError("RATE_LIMITED", 429);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonError("INVALID_JSON", 400);
    }

    const messages = (body as { messages?: unknown })?.messages;
    const rawLang = (body as { language?: unknown })?.language;
    const language = typeof rawLang === "string" && /^[a-zA-Z-]{2,10}$/.test(rawLang) ? rawLang : "en";
    const LANG_NAMES: Record<string, string> = {
      en: "English", es: "Spanish", nl: "Dutch", zh: "Mandarin Chinese", hi: "Hindi",
      ar: "Arabic", fr: "French", de: "German", pt: "Portuguese", bn: "Bengali",
      ru: "Russian", ur: "Urdu", id: "Indonesian", ja: "Japanese", sw: "Swahili",
      tr: "Turkish", it: "Italian", ko: "Korean",
    };
    const langName = LANG_NAMES[language] ?? "English";
    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonError("INVALID_PAYLOAD", 400);
    }
    if (messages.length > MAX_MESSAGES) return jsonError("TOO_MANY_MESSAGES", 400);

    let totalChars = 0;
    const cleanMessages: Array<{ role: string; content: string }> = [];
    for (const m of messages) {
      if (!m || typeof m !== "object") return jsonError("INVALID_MESSAGE", 400);
      const role = (m as { role?: unknown }).role;
      const content = (m as { content?: unknown }).content;
      if (typeof role !== "string" || !ALLOWED_ROLES.has(role)) return jsonError("INVALID_ROLE", 400);
      if (typeof content !== "string" || content.length === 0) return jsonError("INVALID_CONTENT", 400);
      if (content.length > MAX_CONTENT_LENGTH) return jsonError("CONTENT_TOO_LONG", 400);
      totalChars += content.length;
      if (totalChars > MAX_TOTAL_CHARS) return jsonError("PAYLOAD_TOO_LARGE", 400);
      cleanMessages.push({ role, content });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY missing");
      return jsonError("CONFIG_ERROR", 500);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: `Always respond in ${langName} (language code: ${language}), regardless of the language the user writes in. Keep proper nouns and brand names in their original form.` },
          ...cleanMessages,
        ],
        stream: true,
      }),
    });

    if (response.status === 429) return jsonError("RATE_LIMITED", 429);
    if (response.status === 402) return jsonError("CREDITS_EXHAUSTED", 402);
    if (!response.ok) {
      console.error("AI gateway error", response.status, await response.text().catch(() => ""));
      return jsonError("GATEWAY_ERROR", 502);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return jsonError("INTERNAL_ERROR", 500);
  }
});
