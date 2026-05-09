import { createFileRoute } from "@tanstack/react-router";
import { EventsTab } from "@/components/tabs/EventsTab";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/events")({
  head: () =>
    pageHead({
      path: "/events",
      title: "Executive Events — BizzSurfer Go!",
      description:
        "Live events, roundtables, and masterclasses on Agentic AI for boards, CEOs, and transformation leaders.",
      breadcrumbName: "Events",
    }),
  component: EventsTab,
});
