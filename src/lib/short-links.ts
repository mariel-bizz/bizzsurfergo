import { SITE, eventSlug, eventStatus, type FeedEvent } from "./events-data";
import { slugify } from "./slugify";
import { withBizzSuffix } from "./link-suffix";
import type { Listing } from "./marketplace-data";

/** Path-mirroring share URLs for newsletter / social. */

export function eventSharePath(e: FeedEvent): string {
  return `/events/${eventStatus(e)}/${eventSlug(e)}`;
}
export function eventShareUrl(e: FeedEvent): string {
  return `${SITE}${eventSharePath(e)}`;
}

export function postSharePath(slug: string): string {
  return `/insights/${withBizzSuffix(slug)}`;
}
export function postShareUrl(slug: string): string {
  return `${SITE}${postSharePath(slug)}`;
}

export function listingSharePath(l: Listing): string {
  return `/marketplace/${slugify(l.title) || l.id}`;
}
export function listingShareUrl(l: Listing): string {
  return `${SITE}${listingSharePath(l)}`;
}
