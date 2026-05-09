import { createFileRoute } from "@tanstack/react-router";
import { events, eventDate, eventLink, escapeXml, SITE } from "@/lib/events-data";

export const Route = createFileRoute("/feed.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sorted = [...events].sort(
          (a, b) => eventDate(a).getTime() - eventDate(b).getTime(),
        );
        const lastBuild = new Date().toUTCString();
        const items = sorted
          .map((e) => {
            const link = eventLink(e);
            const pub = eventDate(e).toUTCString();
            const desc = `${e.subtitle} — ${e.date} at ${e.time}. ${e.location}. Speaker: ${e.speaker}.`;
            return `    <item>
      <title>${escapeXml(e.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">bizzsurfer-event-${e.id}</guid>
      <pubDate>${pub}</pubDate>
      <category>${escapeXml(e.badge)}</category>
      <description>${escapeXml(desc)}</description>
    </item>`;
          })
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>BizzSurfer Go! — Executive Events</title>
    <link>${SITE}/events</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Live conversations shaping Agentic AI for business transformation.</description>
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
