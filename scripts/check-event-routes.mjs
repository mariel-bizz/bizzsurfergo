#!/usr/bin/env node
/**
 * Verifies every /events/$status/$slug URL returns 200 and that legacy
 * /events_/... paths redirect (3xx) to the canonical path.
 *
 * Usage:
 *   node scripts/check-event-routes.mjs                # checks https://go.bizzsurfer.ai
 *   BASE_URL=https://preview.example node scripts/check-event-routes.mjs
 */
import { events, pastEvents, eventStatus, eventSlug } from "../src/lib/events-data.ts";

const BASE = (process.env.BASE_URL || "https://go.bizzsurfer.ai").replace(/\/$/, "");

const all = [...events, ...pastEvents];
let failed = 0;

async function head(url) {
  // Use GET with redirect:'manual' so we can inspect 301/302 chains.
  const res = await fetch(url, { method: "GET", redirect: "manual" });
  return { status: res.status, location: res.headers.get("location") };
}

console.log(`Checking ${all.length} event routes against ${BASE}\n`);

for (const e of all) {
  const slug = eventSlug(e);
  const status = eventStatus(e);
  const canonical = `${BASE}/events/${status}/${slug}`;
  const legacy = `${BASE}/events_/${status}/${slug}`;

  const c = await head(canonical);
  const okCanonical = c.status === 200;
  console.log(
    `${okCanonical ? "✅" : "❌"} 200  ${canonical}  (got ${c.status})`,
  );
  if (!okCanonical) failed++;

  const l = await head(legacy);
  const okLegacy =
    l.status >= 300 &&
    l.status < 400 &&
    (l.location || "").includes(`/events/${status}/${slug}`);
  console.log(
    `${okLegacy ? "✅" : "❌"} 3xx  ${legacy}  (got ${l.status} → ${l.location ?? "—"})`,
  );
  if (!okLegacy) failed++;
}

console.log(`\n${failed === 0 ? "All checks passed" : `${failed} check(s) failed`}`);
process.exit(failed === 0 ? 0 : 1);
