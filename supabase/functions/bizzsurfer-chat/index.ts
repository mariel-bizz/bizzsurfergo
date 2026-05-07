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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
