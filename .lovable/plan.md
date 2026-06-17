
## Goal

Give every shareable item a clean, newsletter-friendly URL under prefixed namespaces, so links like `https://go.bizzsurfer.ai/e/linkedin-agentic-ai-vs-ai-agents-bizzsurfer-webinar` render the right page directly with proper Open Graph metadata.

## URL scheme

- `/e/{slug}` — events (upcoming + past)
- `/p/{slug}` — insights / posts
- `/m/{slug}` — marketplace listings

Each slug is auto-generated from the item's title (lowercased, ASCII-folded, non-alphanumerics → `-`, trimmed). Collisions are resolved by appending the item id.

## What I'll build

### 1. Slug utility — `src/lib/slugify.ts`
- `slugify(title)` → kebab-case ASCII slug.
- `buildSlugMap(items, getTitle, getId)` → `Map<slug, item>`, dedupes collisions by suffixing the id.

### 2. Event slugs — `src/lib/events-data.ts`
- Add `eventSlug(e)` helper (no schema change; derived from title + id fallback).
- Combined `allEvents` accessor merging `events` + `pastEvents` for slug lookup.

### 3. New routes
- `src/routes/e.$slug.tsx` — looks up event by slug from `allEvents`; renders a dedicated event detail view (reuses the existing event card layout from `EventsTab`, plus speaker, date/time, location, RSVP / Watch replay CTA, and "Add to calendar" links from `calendar-links.ts`). 404 via `notFoundComponent` if slug unknown. Full `head()` with title, description, og:title/description/url/type=event, canonical, and `Event` JSON-LD.
- `src/routes/p.$slug.tsx` — resolves the insights slug (using `getBlogPost` / `fetchBlogPostBySlug`) and redirects to the canonical `/insights/$slug` route (preserving the existing insights page). This keeps `/p/...` as a stable short link without duplicating the article UI.
- `src/routes/m.$slug.tsx` — looks up a marketplace listing by slugified title (via `listings` in `marketplace-data.ts`) and redirects to `/marketplace/{listingId}`.

Events get a fully rendered page (best for newsletter sharing + OG previews). Insights and marketplace use redirects so we don't duplicate their existing rich detail pages — the short `/p/...` and `/m/...` URLs are still safe to share.

### 4. Sitemap — `src/routes/sitemap[.]xml.ts`
- Add one `<url>` entry per event under `/e/{slug}` (upcoming + past).
- Add `/p/{slug}` and `/m/{slug}` entries alongside existing `/insights/...` and `/marketplace/...` entries.

### 5. Optional helper (small, additive)
- Export `eventShortUrl(e)`, `listingShortUrl(l)`, `postShortUrl(p)` from a new `src/lib/short-links.ts` so newsletter / share buttons can use them consistently later. Not wired into UI in this pass — just available.

## Out of scope (this turn)

- Changing existing `/events`, `/insights/$slug`, `/marketplace/$listingId` routes.
- Editing newsletter components to swap in the new URLs (can be a follow-up — say the word and I'll wire them).
- Custom OG images per event (we'll use page-level metadata; existing images stay).

## Example

For the LinkedIn replay shown in your screenshot:
`https://go.bizzsurfer.ai/e/agentic-ai-vs-ai-agents` → renders the event detail page with title, speaker, "Watch replay" CTA, and proper share preview.

Confirm and I'll build it.
