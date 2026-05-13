import { createFileRoute } from "@tanstack/react-router";
import { fetchBlogPosts } from "@/lib/contentful.server";

const SITE = "https://go.bizzsurfer.ai";

type Entry = { path: string; priority: string; changefreq?: string; lastmod?: string };

const STATIC: Entry[] = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/chat", priority: "0.8", changefreq: "weekly" },
  { path: "/events", priority: "0.8", changefreq: "weekly" },
  { path: "/pricing", priority: "0.8", changefreq: "weekly" },
  { path: "/profile", priority: "0.5", changefreq: "monthly" },
  { path: "/marketplace", priority: "0.8", changefreq: "weekly" },
  { path: "/resources", priority: "0.6", changefreq: "monthly" },
  { path: "/insights", priority: "0.8", changefreq: "weekly" },
  { path: "/login", priority: "0.3", changefreq: "yearly" },
  { path: "/reset-password", priority: "0.2", changefreq: "yearly" },
  { path: "/feed.xml", priority: "0.4", changefreq: "weekly" },
  { path: "/atom.xml", priority: "0.4", changefreq: "weekly" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const entries: Entry[] = STATIC.map((e) => ({ ...e, lastmod: e.lastmod ?? today }));

        try {
          const posts = await fetchBlogPosts();
          for (const p of posts) {
            entries.push({
              path: `/insights/${p.slug}`,
              priority: "0.7",
              changefreq: "monthly",
              lastmod: (p.publishedDate || today).slice(0, 10),
            });
          }
        } catch {
          // If Contentful is unavailable, still serve the static portion.
        }

        const urls = entries
          .map(
            (e) =>
              `  <url><loc>${SITE}${e.path}</loc><lastmod>${e.lastmod}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
