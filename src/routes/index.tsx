import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://bizzsurfergo.lovable.app/" }],
  }),
  component: Index,
});

function Index() {
  return <AppShell />;
}
