import { createFileRoute } from "@tanstack/react-router";
import { events } from "@/lib/events-data";
import { buildICS } from "@/lib/calendar-links";

export const Route = createFileRoute("/api/public/events/$eventId.ics")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = Number((params as { eventId: string }).eventId);
        const e = events.find((x) => x.id === id);
        if (!e) return new Response("Not found", { status: 404 });
        const ics = buildICS(e);
        return new Response(ics, {
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": `attachment; filename="bizzsurfer-event-${id}.ics"`,
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});
