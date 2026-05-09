import { createFileRoute } from "@tanstack/react-router";
import { ChatTab } from "@/components/tabs/ChatTab";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/chat")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : undefined }),
  head: () =>
    pageHead({
      path: "/chat",
      title: "Talk to BizzSurfer Go! — Agentic AI Advisor",
      description:
        "Chat with BizzSurfer Go!, an Agentic AI advisor for enterprise transformation leaders. Ask about strategy, adoption, KPIs, and Agentic AI rollouts.",
      breadcrumbName: "Chat",
    }),
  component: ChatRoute,
});

function ChatRoute() {
  const { q } = Route.useSearch();
  return <ChatTab seedPrompt={q} />;
}
