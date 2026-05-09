import { createFileRoute } from "@tanstack/react-router";
import { PricingTab } from "@/components/tabs/PricingTab";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/pricing")({
  head: () =>
    pageHead({
      path: "/pricing",
      title: "Pricing — BizzSurfer Go!",
      description:
        "BizzSurfer Go! pricing for enterprise transformation teams adopting Agentic AI.",
      breadcrumbName: "Pricing",
    }),
  component: PricingTab,
});
