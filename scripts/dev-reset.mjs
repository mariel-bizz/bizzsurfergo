#!/usr/bin/env node
// dev:reset — clears Vite caches, starts the dev server, tails logs to a file,
// runs a smoke test against /api/public/health, and auto-restarts on stale-dep
// or 504 errors observed in the dev server output.
import { spawn } from "node:child_process";
import { rmSync, existsSync, mkdirSync, createWriteStream } from "node:fs";
import { dirname } from "node:path";

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || "localhost";
const BASE_URL = `http://${HOST}:${PORT}`;
const HEALTH_URL = `${BASE_URL}/api/public/health`;
const TIMEOUT_MS = 45_000;
const POLL_INTERVAL_MS = 500;
const LOG_FILE = process.env.DEV_RESET_LOG || "/tmp/dev-server-logs/dev-reset.log";
const MAX_AUTO_RESTARTS = 3;

const STALE_DEP_PATTERNS = [
  /Failed to reload/i,
  /optimized dependencies changed/i,
  /need to be re-optimized/i,
  /504 \(Outdated Optimize Dep\)/i,
  /Pre-transform error/i,
  /ERR_OUTDATED_OPTIMIZED_DEP/i,
];

function clearCaches() {
  for (const d of ["node_modules/.vite", ".vite"]) {
    if (existsSync(d)) {
      rmSync(d, { recursive: true, force: true });
      console.log(`[dev:reset] Cleared ${d}`);
    }
  }
}

function ensureLogFile() {
  mkdirSync(dirname(LOG_FILE), { recursive: true });
  return createWriteStream(LOG_FILE, { flags: "a" });
}

function startDevServer(logStream) {
  const viteBin = process.platform === "win32" ? "vite.cmd" : "vite";
  const child = spawn(viteBin, ["dev"], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
    env: { ...process.env },
  });

  const onData = (buf) => {
    const s = buf.toString();
    process.stdout.write(s);
    logStream.write(s);
    if (!child.__staleDetected && STALE_DEP_PATTERNS.some((re) => re.test(s))) {
      child.__staleDetected = true;
      child.emit("stale-deps");
    }
  };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);
  return child;
}

async function pollHealth(url, timeoutMs, intervalMs) {
  const start = Date.now();
  let lastStatus = "no response";
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: "GET" });
      lastStatus = String(res.status);
      if (res.status === 200) return true;
      if (res.status === 504) throw new Error("504 from dev server");
    } catch (e) {
      lastStatus = e instanceof Error ? e.message : String(e);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Smoke test failed for ${url} (last: ${lastStatus})`);
}

async function killChild(child) {
  if (!child || child.killed) return;
  child.kill("SIGTERM");
  await new Promise((r) => {
    const t = setTimeout(() => {
      try { child.kill("SIGKILL"); } catch {}
      r();
    }, 3000);
    child.once("exit", () => { clearTimeout(t); r(); });
  });
}

async function runOnce(logStream) {
  clearCaches();
  console.log(`[dev:reset] Starting dev server… (logs → ${LOG_FILE})`);
  const child = startDevServer(logStream);

  const stalePromise = new Promise((resolve) =>
    child.once("stale-deps", () => resolve("stale")),
  );
  const exitPromise = new Promise((resolve) =>
    child.once("exit", (code) => resolve({ exit: code })),
  );
  const smokePromise = pollHealth(HEALTH_URL, TIMEOUT_MS, POLL_INTERVAL_MS)
    .then(() => "ok")
    .catch((e) => ({ error: e }));

  const outcome = await Promise.race([smokePromise, stalePromise, exitPromise]);

  if (outcome === "ok") {
    console.log(`\n\x1b[32m[dev:reset] ✅ Smoke test passed at ${HEALTH_URL}\x1b[0m\n`);
    return { child, restart: false };
  }
  if (outcome === "stale") {
    console.log("\n\x1b[33m[dev:reset] ⚠ Stale dependency detected — restarting…\x1b[0m\n");
    await killChild(child);
    return { child: null, restart: true };
  }
  console.error(
    `\n\x1b[31m[dev:reset] ❌ ${outcome?.error?.message ?? `dev server exited (${outcome?.exit})`}\x1b[0m`,
  );
  await killChild(child);
  return { child: null, restart: false, failed: true };
}

async function main() {
  const logStream = ensureLogFile();
  logStream.write(`\n===== dev:reset @ ${new Date().toISOString()} =====\n`);

  let attempt = 0;
  let active = null;
  while (attempt <= MAX_AUTO_RESTARTS) {
    const { child, restart, failed } = await runOnce(logStream);
    if (failed) process.exit(1);
    if (!restart) { active = child; break; }
    attempt++;
    if (attempt > MAX_AUTO_RESTARTS) {
      console.error("[dev:reset] Exceeded auto-restart budget; giving up.");
      process.exit(1);
    }
  }

  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => active?.kill(sig));
  }
  active?.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
