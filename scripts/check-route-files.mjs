#!/usr/bin/env node
// Validates that every route file referenced by src/routeTree.gen.ts exists on disk.
// Usage: node scripts/check-route-files.mjs [--quiet]
// Exit code: 0 if OK, 1 if any referenced route file is missing.
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TREE = join(ROOT, "src", "routeTree.gen.ts");

export function checkRouteFiles({ quiet = false } = {}) {
  if (!existsSync(TREE)) {
    return { ok: true, missing: [], skipped: true };
  }
  const src = readFileSync(TREE, "utf8");
  const re = /from\s+['"](\.\/routes\/[^'"]+)['"]/g;
  const missing = [];
  const seen = new Set();
  let m;
  while ((m = re.exec(src))) {
    const rel = m[1];
    if (seen.has(rel)) continue;
    seen.add(rel);
    const base = join(ROOT, "src", rel);
    const candidates = [base, `${base}.tsx`, `${base}.ts`, join(base, "index.tsx"), join(base, "index.ts")];
    if (!candidates.some((p) => existsSync(p))) missing.push(rel);
  }
  if (missing.length && !quiet) {
    console.error("\n\u001b[31m[route-check] Stale routeTree.gen.ts — missing route files:\u001b[0m");
    for (const r of missing) console.error("  - src/" + r);
    console.error("\nFix: restart the dev server so TanStack Router regenerates src/routeTree.gen.ts.\n");
  }
  return { ok: missing.length === 0, missing, skipped: false };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const quiet = process.argv.includes("--quiet");
  const { ok, skipped } = checkRouteFiles({ quiet });
  if (skipped && !quiet) console.log("[route-check] No routeTree.gen.ts yet — skipping.");
  else if (ok && !quiet) console.log("[route-check] All route files present.");
  process.exit(ok ? 0 : 1);
}
