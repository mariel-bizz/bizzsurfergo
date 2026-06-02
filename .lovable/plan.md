
## Goal
You maintain a Google Sheet of news items. A daily job pulls it into the `market_news` table. Every row automatically gets a branded `/bizzsurfer-news/<slug>` share URL (already built).

## What you do (one-time)
1. Create a Google Sheet with these columns (header row, exact names):
   `slug, title, summary, source, source_url, image_url, published_at, category`
   - `slug`: lowercase, hyphenated, unique (e.g. `microsoft-wti-2026`). If left blank, the job auto-generates one from the title.
   - `published_at`: ISO date (`2026-06-01`) or blank.
   - `category`: defaults to `Operators` if blank.
2. File → Share → **Publish to web** → choose the sheet → **CSV** → copy the URL.
3. Paste that URL once into a new secret `MARKET_NEWS_CSV_URL`.

## What I build
1. **Server route** `/api/public/hooks/sync-market-news` (POST):
   - Fetches the published CSV URL.
   - Parses rows, auto-slugifies missing slugs, validates with Zod.
   - Upserts into `market_news` by `slug` (existing rows updated, new ones inserted).
   - Returns `{ inserted, updated, skipped, errors }`.
   - Auth via `apikey` header (Supabase anon key).
2. **pg_cron job** running daily at 06:00 UTC that calls the route.
3. **Admin trigger button** on `/admin/storage` (or a small `/admin/market-news` page) so you can click "Sync now" without waiting for cron.
4. **`/market-trends` page** already reads from `market_news` — no change needed; new rows appear automatically with their share buttons.

## Out of scope
- No scraping of the Perplexity page.
- No file upload UI (Google Sheet is the source of truth).
- No changes to the existing branded share page.

## Technical notes
- CSV parsing: lightweight inline parser (handles quoted fields, commas, newlines) — no new dependency.
- Idempotent upsert on `slug` unique constraint.
- Rows with invalid `source_url` are skipped and reported in the response (not fatal).
- pg_cron uses the stable URL `https://project--93cf30e3-bdcc-47f4-a14e-e80c68d0be7a.lovable.app/api/public/hooks/sync-market-news`.
