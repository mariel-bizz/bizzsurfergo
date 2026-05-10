const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANG_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", nl: "Dutch", zh: "Mandarin Chinese", hi: "Hindi",
  ar: "Arabic", fr: "French", de: "German", pt: "Portuguese", bn: "Bengali",
  ru: "Russian", ur: "Urdu", id: "Indonesian", ja: "Japanese", sw: "Swahili",
  tr: "Turkish", it: "Italian", ko: "Korean",
};

const RATE_LIMIT = 30; // requests per minute per IP
const WINDOW_MS = 60_000;
const ipHits = new Map<string, { count: number; reset: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || entry.reset < now) {
    ipHits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    if (!rateLimit(ip)) {
      return new Response(JSON.stringify({ error: "rate_limit" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { texts, target } = await req.json();
    if (!Array.isArray(texts) || !target || target === "en") {
      return new Response(JSON.stringify({ translations: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const langName = LANG_NAMES[target] || target;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const numbered = texts.map((t: string, i: number) => `${i}. ${t}`).join("\n");
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `Translate UI strings from English to ${langName}. Preserve punctuation, numbers, emojis, and brand names like "BizzSurfer Go!". Keep translations concise so they fit UI buttons. Return only the translation via the tool call.` },
          { role: "user", content: `Translate each of the following ${texts.length} strings to ${langName}:\n${numbered}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_translations",
            description: "Return translated strings in same order",
            parameters: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: { type: "object", properties: { i: { type: "number" }, t: { type: "string" } }, required: ["i", "t"] },
                },
              },
              required: ["items"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_translations" } },
      }),
    });

    if (resp.status === 429) return new Response(JSON.stringify({ error: "rate_limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "credits" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) throw new Error(`AI ${resp.status}`);

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { items: [] };
    const translations: Record<string, string> = {};
    for (const it of parsed.items || []) {
      const src = texts[it.i];
      if (src && typeof it.t === "string") translations[src] = it.t;
    }
    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-ui error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
