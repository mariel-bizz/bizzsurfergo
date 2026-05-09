import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        name: "description",
        content:
          "BizzSurfer Go! brings Agentic AI to enterprise transformation leaders—connect your business systems and orchestrate change with AI agents, ROI tools, and expert resources.",
      },
    ],
    links: [{ rel: "canonical", href: "https://bizzsurfergo.lovable.app/" }],
  }),
  component: Index,
});

function Index() {
  return <AppShell />;
}
