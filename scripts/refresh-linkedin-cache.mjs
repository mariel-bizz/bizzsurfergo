#!/usr/bin/env node
/**
 * Asks LinkedIn's Post Inspector to re-scrape every event share URL so
 * cached previews (title / image / description) are refreshed.
 *
 * LinkedIn doesn't expose a public re-scrape API; the documented path is
 * https://www.linkedin.com/post-inspector/inspect/<encoded-url> — hitting
 * it forces a fresh crawl of the OG tags.
 *
 * Usage:
 *   node scripts/refresh-linkedin-cache.mjs
 *   BASE_URL=https://go.bizzsurfer.ai node scripts/refresh-linkedin-cache.mjs
 */
import { events, pastEvents, eventStatus, eventSlug } from "../src/lib/events-data.ts";

const BASE = (process.env.BASE_URL || "https://go.bizzsurfer.ai").replace(/\/$/, "");
const all = [...events, ...pastEvents];

console.log(`Asking LinkedIn to re-crawl ${all.length} event URLs\n`);

for (const e of all) {
  const url = `${BASE}/events/${eventStatus(e)}/${eventSlug(e)}`;
  const inspector = `https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(url)}`;
  try {
    const res = await fetch(inspector, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BizzSurferCacheRefresh/1.0; +https://go.bizzsurfer.ai)",
      },
    });
    console.log(`${res.ok ? "✅" : "⚠️ "} ${res.status}  ${url}`);
  } catch (err) {
    console.log(`❌  ${url}  (${err.message})`);
  }
}

console.log(
  "\nDone. Open https://www.linkedin.com/post-inspector/ and paste any URL to confirm the preview.",
);
