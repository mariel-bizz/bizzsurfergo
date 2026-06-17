import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Short link: /p/{slug} -> /insights/{slug}.
 * Preserves query params (utm_*, ref, etc.) for newsletter tracking.
 */
export const Route = createFileRoute("/p/$slug")({
  validateSearch: (s: Record<string, unknown>) => s,
  beforeLoad: ({ params, search }) => {
    throw redirect({ to: "/insights/$slug", params: { slug: params.slug }, search });
  },
});
