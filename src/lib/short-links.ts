import { SITE, eventSlug, type FeedEvent } from "./events-data";
import { slugify } from "./slugify";
import type { Listing } from "./marketplace-data";

/** Short, newsletter-friendly URLs for shareable items. */

export function eventShortPath(e: FeedEvent): string {
  return `/e/${eventSlug(e)}`;
}
export function eventShortUrl(e: FeedEvent): string {
  return `${SITE}${eventShortPath(e)}`;
}

export function postShortPath(slug: string): string {
  return `/p/${slug}`;
}
export function postShortUrl(slug: string): string {
  return `${SITE}${postShortPath(slug)}`;
}

export function listingShortPath(l: Listing): string {
  return `/m/${slugify(l.title) || l.id}`;
}
export function listingShortUrl(l: Listing): string {
  return `${SITE}${listingShortPath(l)}`;
}
