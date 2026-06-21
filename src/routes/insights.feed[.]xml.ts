import { createFileRoute } from "@tanstack/react-router";
import { fetchBlogPosts } from "@/lib/contentful.server";
import { escapeXml } from "@/lib/events-data";
import { withBizzSuffix } from "@/lib/link-suffix";

const SITE = "https://go.bizzsurfer.ai";

function matches(
  p: { title: string; excerpt: string; author: string | null },
  q: string,
) {
  if (!q) return true;
  const hay = `${p.title} ${p.excerpt} ${p.author ?? ""}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

export const Route = createFileRoute("/insights/feed.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const category = url.searchParams.get("category")?.trim() || "";
        const q = url.searchParams.get("q")?.trim() || "";
        const format = url.searchParams.get("format") === "atom" ? "atom" : "rss";

        let posts: Awaited<ReturnType<typeof fetchBlogPosts>> = [];
        try {
          posts = await fetchBlogPosts();
        } catch {
          posts = [];
        }
        const filtered = posts.filter(
          (p) => (!category || p.category === category) && matches(p, q),
        );

        const suffix = [
          category ? `category=${category}` : null,
          q ? `q=${q}` : null,
        ]
          .filter(Boolean)
          .join(" · ");
        const feedTitle = `BizzSurfer Insights${suffix ? ` (${suffix})` : ""}`;
        const selfUrl = `${SITE}/insights/feed.xml${url.search}`;
        const lastBuild = new Date().toUTCString();
        const updated = new Date().toISOString();

        if (format === "atom") {
          const entries = filtered
            .map((p) => {
              const link = `${SITE}/insights/${withBizzSuffix(p.slug)}`;
              const pub = p.publishedDate
                ? new Date(p.publishedDate).toISOString()
                : updated;
              return `  <entry>
    <title>${escapeXml(p.title)}</title>
    <link href="${escapeXml(link)}" />
    <id>urn:bizzsurfer:insight:${escapeXml(p.id)}</id>
    <updated>${pub}</updated>
    <published>${pub}</published>${p.category ? `\n    <category term="${escapeXml(p.category)}" />` : ""}${p.author ? `\n    <author><name>${escapeXml(p.author)}</name></author>` : ""}
    <summary>${escapeXml(p.excerpt || "")}</summary>
  </entry>`;
            })
            .join("\n");
          const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(feedTitle)}</title>
  <link rel="alternate" href="${SITE}/insights" />
  <link rel="self" href="${escapeXml(selfUrl)}" />
  <id>${escapeXml(selfUrl)}</id>
  <updated>${updated}</updated>
${entries}
</feed>`;
          return new Response(xml, {
            headers: {
              "Content-Type": "application/atom+xml; charset=utf-8",
              "Cache-Control": "public, max-age=900",
            },
          });
        }

        const items = filtered
          .map((p) => {
            const link = `${SITE}/insights/${withBizzSuffix(p.slug)}`;
            const pub = p.publishedDate
              ? new Date(p.publishedDate).toUTCString()
              : lastBuild;
            return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">bizzsurfer-insight-${escapeXml(p.id)}</guid>
      <pubDate>${pub}</pubDate>${p.category ? `\n      <category>${escapeXml(p.category)}</category>` : ""}
      <description>${escapeXml(p.excerpt || "")}</description>
    </item>`;
          })
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${SITE}/insights</link>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
    <description>Playbooks, frameworks and insights from BizzSurfer.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=900",
          },
        });
      },
    },
  },
});
