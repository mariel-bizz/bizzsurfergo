import { createFileRoute } from "@tanstack/react-router";
import { EventsTab } from "@/components/tabs/EventsTab";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/events")({
  head: () => {
    const base = pageHead({
      path: "/events",
      title: "Executive Events — BizzSurfer Go!",
      description:
        "Live events, roundtables, and masterclasses on Agentic AI for boards, CEOs, and transformation leaders.",
      breadcrumbName: "Events",
    });
    return {
      ...base,
      links: [
        ...(base.links ?? []),
        { rel: "alternate", type: "application/rss+xml", title: "BizzSurfer Events (RSS)", href: "https://bizzsurfergo.lovable.app/feed.xml" },
        { rel: "alternate", type: "application/atom+xml", title: "BizzSurfer Events (Atom)", href: "https://bizzsurfergo.lovable.app/atom.xml" },
      ],
    };
  },
  component: EventsTab,
});
