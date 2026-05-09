import { createFileRoute } from "@tanstack/react-router";
import { events, eventDate, eventLink, escapeXml, SITE } from "@/lib/events-data";

export const Route = createFileRoute("/atom.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sorted = [...events].sort(
          (a, b) => eventDate(a).getTime() - eventDate(b).getTime(),
        );
        const updated =
          sorted.length > 0
            ? eventDate(sorted[sorted.length - 1]).toISOString()
            : new Date().toISOString();
        const entries = sorted
          .map((e) => {
            const link = eventLink(e);
            const pub = eventDate(e).toISOString();
            const desc = `${e.subtitle} — ${e.date} at ${e.time}. ${e.location}. Speaker: ${e.speaker}.`;
            return `  <entry>
    <title>${escapeXml(e.title)}</title>
    <link href="${escapeXml(link)}" />
    <id>urn:bizzsurfer:event:${e.id}</id>
    <updated>${pub}</updated>
    <published>${pub}</published>
    <category term="${escapeXml(e.badge)}" />
    <author><name>${escapeXml(e.speaker)}</name></author>
    <summary>${escapeXml(desc)}</summary>
  </entry>`;
          })
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>BizzSurfer Go! — Executive Events</title>
  <link rel="alternate" href="${SITE}/events" />
  <link rel="self" href="${SITE}/atom.xml" />
  <id>${SITE}/atom.xml</id>
  <updated>${updated}</updated>
  <subtitle>Live conversations shaping Agentic AI for business transformation.</subtitle>
${entries}
</feed>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/atom+xml; charset=utf-8",
            "Cache-Control": "public, max-age=900",
          },
        });
      },
    },
  },
});
