#!/usr/bin/env node
/**
 * Automated check for /insights/$slug routes.
 *
 * - Fetches the sitemap and extracts every /insights/<slug> URL.
 * - Asserts each one returns HTTP 200.
 * - Asserts the rendered HTML contains og:url / og:title / og:description
 *   and that canonical/og:url are consistent.
 * - Asserts the suffixed slug and the bare slug both resolve (slug mapping).
 *
 * Usage:
 *   node scripts/check-insights-routes.mjs
 *   BASE_URL=https://bizzsurfergo.lovable.app node scripts/check-insights-routes.mjs
 */

const BASE = (process.env.BASE_URL || "https://go.bizzsurfer.ai").replace(/\/$/, "");
const SUFFIX = "-bizzsurfer";

function pick(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

async function head(url) {
  const r = await fetch(url, { redirect: "manual" });
  return { status: r.status, location: r.headers.get("location") };
}

async function get(url) {
  const r = await fetch(url, { redirect: "follow" });
  const text = await r.text();
  return { status: r.status, text, finalUrl: r.url };
}

async function main() {
  console.log(`Base: ${BASE}`);
  const sitemap = await get(`${BASE}/sitemap.xml`);
  if (sitemap.status !== 200) {
    console.error(`✗ sitemap.xml returned ${sitemap.status}`);
    process.exit(1);
  }
  const slugs = Array.from(
    sitemap.text.matchAll(/<loc>[^<]*\/insights\/([^<]+?)<\/loc>/g),
  ).map((m) => m[1]);
  if (!slugs.length) {
    console.error("✗ no /insights/<slug> URLs in sitemap");
    process.exit(1);
  }
  console.log(`Found ${slugs.length} insight URLs in sitemap.\n`);

  let failed = 0;
  for (const slug of slugs) {
    const bare = slug.endsWith(SUFFIX) ? slug.slice(0, -SUFFIX.length) : slug;
    const urlSuffixed = `${BASE}/insights/${bare}${SUFFIX}`;
    const urlBare = `${BASE}/insights/${bare}`;

    const [a, b] = await Promise.all([get(urlSuffixed), get(urlBare)]);
    const errs = [];
    if (a.status !== 200) errs.push(`suffixed=${a.status}`);
    if (b.status !== 200) errs.push(`bare=${b.status}`);

    const ogUrl = pick(a.text, /property=["']og:url["']\s+content=["']([^"']+)["']/i);
    const ogTitle = pick(a.text, /property=["']og:title["']\s+content=["']([^"']+)["']/i);
    const ogDesc = pick(a.text, /property=["']og:description["']\s+content=["']([^"']+)["']/i);
    const ogImg = pick(a.text, /property=["']og:image["']\s+content=["']([^"']+)["']/i);
    const canonical = pick(a.text, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);

    if (!ogTitle) errs.push("no og:title");
    if (!ogDesc) errs.push("no og:description");
    if (!ogUrl) errs.push("no og:url");
    if (!canonical) errs.push("no canonical");
    if (ogUrl && canonical && ogUrl !== canonical)
      errs.push(`og:url≠canonical (${ogUrl} vs ${canonical})`);
    // Either-or: 404 fallback page renders a stub title with no article body.
    if (a.text.includes("Article not found")) errs.push("404 article body");

    if (errs.length) {
      failed++;
      console.log(`✗ ${bare}  ${errs.join(", ")}`);
    } else {
      console.log(`✓ ${bare}  og:image=${ogImg ? "yes" : "no"}`);
    }
  }

  console.log(`\n${slugs.length - failed}/${slugs.length} passed.`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
