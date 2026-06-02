import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type MarketNews = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  source: string;
  source_url: string;
  image_url: string | null;
  published_at: string | null;
  category: string;
  created_at: string;
};

export const listMarketNews = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("market_news")
    .select(
      "id, slug, title, summary, source, source_url, image_url, published_at, category, created_at",
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return { items: (data ?? []) as MarketNews[] };
});

export const getMarketNewsBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => {
    const slug = String(d?.slug ?? "").trim();
    if (!slug || slug.length > 200) throw new Error("invalid slug");
    return { slug };
  })
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("market_news")
      .select(
        "id, slug, title, summary, source, source_url, image_url, published_at, category, created_at",
      )
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { item: (row ?? null) as MarketNews | null };
  });
