// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { checkRouteFiles } from "./scripts/check-route-files.mjs";

// Dev-time guard: TanStack Router writes src/routeTree.gen.ts based on files in
// src/routes/. If a route file is deleted but the generated tree hasn't been
// rewritten yet (stale on disk), Vite blows up with "Failed to load url
// /src/routes/<name>.tsx". This plugin validates references up-front and on
// every change to the generated tree, surfacing a clear error and a fix hint
// instead of an opaque module-resolution crash.
function routeFilesCheckPlugin() {
  const run = (label) => {
    const { ok, missing, skipped } = checkRouteFiles({ quiet: true });
    if (skipped) return;
    if (!ok) {
      const msg =
        `[route-check] Stale src/routeTree.gen.ts (${label}). ` +
        `Missing route files:\n` +
        missing.map((r) => `  - src/${r}`).join("\n") +
        `\nFix: restart the dev server so TanStack Router regenerates the route tree.`;
      console.error("\n\u001b[31m" + msg + "\u001b[0m\n");
    }
  };
  return {
    name: "lovable:route-files-check",
    apply: "serve" as const,
    configResolved() {
      run("startup");
    },
    handleHotUpdate({ file }: { file: string }) {
      if (file.endsWith("routeTree.gen.ts") || file.includes("/src/routes/")) {
        run("change");
      }
    },
  };
}

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [routeFilesCheckPlugin()],
  },
});
