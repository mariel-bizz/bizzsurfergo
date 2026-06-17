#!/usr/bin/env node
// dev:reset — clears Vite caches, starts the dev server, and verifies the app loads.
import { spawn } from "node:child_process";
import { rmSync, existsSync } from "node:fs";

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || "localhost";
const START_URL = `http://${HOST}:${PORT}`;
const TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 500;

function clearCaches() {
  const dirs = ["node_modules/.vite", ".vite"];
  for (const d of dirs) {
    if (existsSync(d)) {
      rmSync(d, { recursive: true, force: true });
      console.log(`[dev:reset] Cleared ${d}`);
    }
  }
}

function pollReady(url, timeoutMs, intervalMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryFetch = async () => {
      try {
        const res = await fetch(url, { method: "GET" });
        if (res.status >= 200 && res.status < 500) {
          resolve();
          return;
        }
      } catch {
        // not ready yet
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url} after ${timeoutMs}ms`));
        return;
      }
      setTimeout(tryFetch, intervalMs);
    };
    tryFetch();
  });
}

async function main() {
  clearCaches();

  console.log("[dev:reset] Starting dev server…");
  const viteBin = process.platform === "win32" ? "vite.cmd" : "vite";
  const child = spawn(viteBin, ["dev"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, PATH: `${process.env.PATH}` },
  });

  // Wait for server to respond
  try {
    await pollReady(START_URL, TIMEOUT_MS, POLL_INTERVAL_MS);
    console.log(`\n\x1b[32m[dev:reset] ✅ App loaded successfully at ${START_URL}\x1b[0m\n`);
  } catch (err) {
    console.error(`\n\x1b[31m[dev:reset] ❌ ${err.message}\x1b[0m`);
    child.kill("SIGTERM");
    process.exit(1);
  }

  // Forward signals so Ctrl+C kills the child cleanly
  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => {
      child.kill(sig);
    });
  }

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
