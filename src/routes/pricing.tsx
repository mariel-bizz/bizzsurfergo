import { createFileRoute } from "@tanstack/react-router";
import { PricingTab } from "@/components/tabs/PricingTab";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/pricing")({
  head: () =>
    pageHead({
      path: "/pricing",
      title: "Upgrade — BizzSurfer Go!",
      description:
        "Upgrade BizzSurfer Go! for enterprise transformation teams adopting Agentic AI.",
      breadcrumbName: "Upgrade",
    }),
  component: PricingTab,
});
