import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/resources")({
  // Preserve any query params (utm_*, ref, etc.) when redirecting to /insights.
  validateSearch: (s: Record<string, unknown>) => s,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/insights", search });
  },
});
