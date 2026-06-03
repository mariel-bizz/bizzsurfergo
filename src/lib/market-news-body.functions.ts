import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { getRequestHeader } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createStripeClient, type StripeEnv } from "@/lib/stripe.server";
import type { Database } from "@/integrations/supabase/types";

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const PREVIEW_PARAGRAPHS = 2;
const PASS_DURATION_MS = 24 * 60 * 60 * 1000;

type NewsRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  source: string;
  source_url: string;
  category: string;
  body: string | null;
};

async function loadRow(slug: string): Promise<NewsRow> {
  const { data: row, error } = await supabaseAdmin
    .from("market_news")
    .select("id, slug, title, summary, source, source_url, category, body")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Article not found");
  return row as NewsRow;
}

async function generateBody(row: NewsRow): Promise<string> {
  if (row.body && row.body.trim().length > 200) return row.body;

  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return buildFallback(row);

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
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
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
      return buildFallback(row);
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content || content.length < 200) return buildFallback(row);
    await supabaseAdmin.from("market_news").update({ body: content }).eq("id", row.id);
    return content;
  } catch (err) {
    console.error("[news-body] ai_exception", (err as Error)?.message);
    return buildFallback(row);
  }
}

function splitParagraphs(body: string): string[] {
  return body.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);
}

function previewOf(body: string): { preview: string; totalParagraphs: number } {
  const paragraphs = splitParagraphs(body);
  return {
    preview: paragraphs.slice(0, PREVIEW_PARAGRAPHS).join("\n\n"),
    totalParagraphs: paragraphs.length,
  };
}

/**
 * Returns ONLY the first {@link PREVIEW_PARAGRAPHS} paragraphs of the article.
 * Safe to call anonymously — the gated paragraphs never leave the server.
 */
export const getMarketNewsPreview = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string }) => {
    const slug = String(d?.slug ?? "").trim();
    if (!slug || slug.length > 200) throw new Error("invalid slug");
    return { slug };
  })
  .handler(async ({ data }) => {
    const row = await loadRow(data.slug);
    const body = await generateBody(row);
    return previewOf(body);
  });

/**
 * Returns the FULL long-form body. Requires either:
 *  - An authenticated user with an active premium subscription, OR
 *  - A valid (paid + within 24h) Stripe News Pass session id.
 *
 * The pass session id is verified server-side against Stripe on every call —
 * client-side localStorage flags are never trusted.
 */
export const getMarketNewsFullBody = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string; passSessionId?: string; environment?: StripeEnv }) => {
    const slug = String(d?.slug ?? "").trim();
    if (!slug || slug.length > 200) throw new Error("invalid slug");
    const passSessionId =
      typeof d?.passSessionId === "string" && /^[a-zA-Z0-9_]+$/.test(d.passSessionId)
        ? d.passSessionId
        : undefined;
    const environment =
      d?.environment === "sandbox" || d?.environment === "live" ? d.environment : undefined;
    return { slug, passSessionId, environment };
  })
  .handler(async ({ data }) => {
    const hasAccess = await checkAccess(data.passSessionId, data.environment);
    if (!hasAccess) {
      throw new Error("News Pass or Premium required to view the full article.");
    }
    const row = await loadRow(data.slug);
    const body = await generateBody(row);
    return { body };
  });

async function checkAccess(
  passSessionId: string | undefined,
  environment: StripeEnv | undefined,
): Promise<boolean> {
  // Path 1: signed-in premium user
  try {
    const auth = getRequestHeader("authorization");
    if (auth?.startsWith("Bearer ")) {
      const token = auth.slice("Bearer ".length).trim();
      const SUPABASE_URL = process.env.SUPABASE_URL;
      const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
      if (token && SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) {
        const sb = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data: claimsData } = await sb.auth.getClaims(token);
        const userId = claimsData?.claims?.sub;
        if (userId) {
          const env =
            (process.env.VITE_PAYMENTS_CLIENT_TOKEN ?? "").startsWith("pk_test_")
              ? "sandbox"
              : "live";
          const { data: sub } = await supabaseAdmin
            .from("subscriptions")
            .select("status,current_period_end")
            .eq("user_id", userId)
            .eq("environment", env)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (sub) {
            const end = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null;
            const future = end === null || end > Date.now();
            if (
              (["active", "trialing", "past_due"].includes(sub.status) && future) ||
              (sub.status === "canceled" && end !== null && end > Date.now())
            ) {
              return true;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[news-body] auth_check_failed", (err as Error)?.message);
  }

  // Path 2: valid News Pass — verified live against Stripe
  if (passSessionId && environment) {
    try {
      const stripe = createStripeClient(environment);
      const session = await stripe.checkout.sessions.retrieve(passSessionId);
      // Only honour sessions that were explicitly created for the News Day Pass.
      if (session.metadata?.product !== "news_day_pass") return false;
      const paid = session.payment_status === "paid" || session.status === "complete";
      const createdMs = (session.created ?? 0) * 1000;
      if (paid && createdMs > 0 && Date.now() - createdMs < PASS_DURATION_MS) {
        return true;
      }
    } catch (err) {
      console.error("[news-body] pass_check_failed", (err as Error)?.message);
    }
  }

  return false;
}

function buildFallback(row: NewsRow): string {
  const summary = row.summary?.trim() || row.title;
  return [
    summary,
    `Reported originally by ${row.source}, the story has implications across enterprise transformation, AI operating models, and how leadership teams measure progress against agentic deployments.`,
    `For transformation leaders, the practical question is no longer whether to adopt agentic AI but how to govern, scale, and instrument it across portfolios of workflows — turning pilots into infrastructure.`,
    `This story was curated by BizzSurfer from ${row.source}. Open the link to read the full original reporting on the publisher's website.`,
  ].join("\n\n");
}
