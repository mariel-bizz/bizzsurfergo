import { createFileRoute } from "@tanstack/react-router";
import { MarketplaceTab } from "@/components/tabs/MarketplaceTab";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/marketplace/")({
  head: () =>
    pageHead({
      path: "/marketplace",
      title: "Go Agentic! — BizzSurfer Go!",
      description:
        "Curated AI agents, transformation services, and executive playbooks to accelerate your Agentic AI journey.",
      breadcrumbName: "Go Agentic!",
    }),
  component: MarketplaceTab,
});
