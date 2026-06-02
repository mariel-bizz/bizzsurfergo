import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

/**
 * Returns the full long-form body for a news item, generating it via the
 * Lovable AI Gateway on first request and caching it on the row. Always
 * returns at least 4 paragraphs of journalistic-style text that closes by
 * naming BizzSurfer as the curator.
 */
export const getMarketNewsBody = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string }) => {
    const slug = String(d?.slug ?? "").trim();
    if (!slug || slug.length > 200) throw new Error("invalid slug");
    return { slug };
  })
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("market_news")
      .select("id, slug, title, summary, source, source_url, category, body")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Article not found");

    if (row.body && row.body.trim().length > 200) {
      return { body: row.body };
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      // Graceful fallback — better something than nothing.
      const fallback = buildFallback(row);
      return { body: fallback };
    }

    const system =
      "You are a senior business journalist writing for BizzSurfer, a publication for enterprise transformation leaders. " +
      "Write in clear, neutral, analytical prose. No marketing fluff, no bullet lists. " +
      "Output 4 to 5 paragraphs separated by a single blank line. " +
      "Do NOT include a title, headline, byline, or section headers. " +
      "Close with one short paragraph that explicitly mentions that the story was curated by BizzSurfer and links back to the original publisher by name.";

    const user =
      `Write a full long-form news article based on the following brief.\n\n` +
      `Title: ${row.title}\n` +
      `Source publication: ${row.source}\n` +
      `Original URL: ${row.source_url}\n` +
      `Category: ${row.category}\n` +
      `Editorial summary: ${row.summary ?? "(no summary)"}\n\n` +
      `Constraints: 350-500 words total, 4-5 paragraphs, no headings, mention BizzSurfer in the final paragraph.`;

    try {
      const res = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[news-body] ai_failed", res.status, text.slice(0, 300));
        return { body: buildFallback(row) };
      }
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content?.trim();
      if (!content || content.length < 200) {
        return { body: buildFallback(row) };
      }

      await supabaseAdmin
        .from("market_news")
        .update({ body: content })
        .eq("id", row.id);

      return { body: content };
    } catch (err) {
      console.error("[news-body] ai_exception", (err as Error)?.message);
      return { body: buildFallback(row) };
    }
  });

function buildFallback(row: {
  title: string;
  summary: string | null;
  source: string;
  source_url: string;
}): string {
  const summary = row.summary?.trim() || row.title;
  return [
    summary,
    `Reported originally by ${row.source}, the story has implications across enterprise transformation, AI operating models, and how leadership teams measure progress against agentic deployments.`,
    `For transformation leaders, the practical question is no longer whether to adopt agentic AI but how to govern, scale, and instrument it across portfolios of workflows — turning pilots into infrastructure.`,
    `This story was curated by BizzSurfer from ${row.source}. Open the link to read the full original reporting on the publisher's website.`,
  ].join("\n\n");
}
