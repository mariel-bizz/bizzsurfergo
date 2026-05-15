import { getListing, parseListingPrice } from "@/lib/marketplace-data";

/**
 * Server-side canonical price resolver for marketplace listings. This is the
 * single source of truth used by checkout server functions — any client
 * input is discarded in favour of the value returned here.
 */
export function resolveCanonicalListingPrice(listingId: string): {
  amountInCents: number;
  currency: "eur";
  interval: "month" | null;
  title: string;
} {
  const listing = getListing(listingId);
  if (!listing) throw new Error("Listing not found");
  const parsed = parseListingPrice(listing.price);
  if (!parsed) throw new Error("Listing is not directly payable");
  return {
    amountInCents: parsed.amountInCents,
    currency: parsed.currency,
    interval: parsed.interval,
    title: listing.title,
  };
}
