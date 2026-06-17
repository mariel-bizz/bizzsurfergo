import { createFileRoute, redirect, notFound } from "@tanstack/react-router";
import { listings } from "@/lib/marketplace-data";
import { slugify, buildSlugMap } from "@/lib/slugify";

const slugMap = buildSlugMap(listings, (l) => l.title, (l) => l.id);

/**
 * Short link: /m/{slug} -> /marketplace/{listingId}.
 * Also accepts the raw listing id for resilience.
 */
export const Route = createFileRoute("/m/$slug")({
  validateSearch: (s: Record<string, unknown>) => s,
  beforeLoad: ({ params, search }) => {
    const direct = listings.find((l) => l.id === params.slug);
    const listing = direct ?? slugMap.get(params.slug) ?? slugMap.get(slugify(params.slug));
    if (!listing) throw notFound();
    throw redirect({
      to: "/marketplace/$listingId",
      params: { listingId: listing.id },
      search,
    });
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Listing not found</h1>
        <p className="text-muted-foreground mt-2">
          <a href="/marketplace" className="underline">Browse the marketplace</a>
        </p>
      </div>
    </div>
  ),
});
