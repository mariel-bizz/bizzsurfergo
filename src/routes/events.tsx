import { createFileRoute } from "@tanstack/react-router";
import { EventsTab } from "@/components/tabs/EventsTab";
import { pageHead } from "@/lib/page-head";
import { events, eventDate } from "@/lib/events-data";

export const Route = createFileRoute("/events")({
  head: () => {
    const base = pageHead({
      path: "/events",
      title: "Executive Events — BizzSurfer Go!",
      description:
        "Live events, roundtables, and masterclasses on Agentic AI for boards, CEOs, and transformation leaders.",
      breadcrumbName: "Events",
    });
    const eventLd = {
      "@context": "https://schema.org",
      "@graph": events.map((e) => ({
        "@type": "Event",
        name: e.title,
        description: e.subtitle,
        startDate: eventDate(e).toISOString(),
        eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: { "@type": "VirtualLocation", url: e.href, name: e.location },
        organizer: { "@type": "Organization", name: "BizzSurfer", url: "https://go.bizzsurfer.ai" },
        performer: { "@type": "Person", name: e.speaker },
      })),
    };
    return {
      ...base,
      links: [
        ...(base.links ?? []),
        { rel: "alternate", type: "application/rss+xml", title: "BizzSurfer Events (RSS)", href: "https://bizzsurfergo.lovable.app/feed.xml" },
        { rel: "alternate", type: "application/atom+xml", title: "BizzSurfer Events (Atom)", href: "https://bizzsurfergo.lovable.app/atom.xml" },
      ],
      scripts: [
        ...(base.scripts ?? []),
        { type: "application/ld+json", children: JSON.stringify(eventLd) },
      ],
    };
  },
  component: EventsTab,
});
