/**
 * Automated RLS test for the private 'storage' bucket.
 *
 * Verifies that only users with the 'admin' role can SELECT, INSERT,
 * UPDATE, and DELETE objects in the `storage` bucket; non-admin
 * authenticated users must be blocked on every operation.
 *
 * Run with:  bun tests/storage-rls.test.ts
 *
 * Requires environment variables:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY)
 *
 * Exits with code 0 on success, 1 on any assertion failure.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !PUBLISHABLE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / publishable key env vars.");
  process.exit(1);
}

const BUCKET = "storage";
const SUFFIX = Math.random().toString(36).slice(2, 8);
const ADMIN_EMAIL = `rls-admin-${SUFFIX}@example.test`;
const USER_EMAIL = `rls-user-${SUFFIX}@example.test`;
const PASSWORD = `Test-${SUFFIX}-Pw!9x`;
const SEED_PATH = `rls-test/${SUFFIX}/seed.txt`;
const ADMIN_PATH = `rls-test/${SUFFIX}/admin-new.txt`;
const ADMIN_PATH_RENAMED = `rls-test/${SUFFIX}/admin-renamed.txt`;
const USER_PATH = `rls-test/${SUFFIX}/should-fail.txt`;

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ ${msg}`);
    failed++;
  }
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function createSignedInClient(email: string): Promise<{ client: SupabaseClient; userId: string }> {
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (createErr || !created.user) throw new Error(`createUser failed: ${createErr?.message}`);
  const userId = created.user.id;

  const userClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInErr } = await userClient.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInErr) throw new Error(`signIn failed: ${signInErr.message}`);
  return { client: userClient, userId };
}

async function main() {
  console.log(`Storage RLS test (suffix: ${SUFFIX})`);
  const createdUserIds: string[] = [];

  try {
    // 1. Ensure bucket exists
    const { data: bucket } = await admin.storage.getBucket(BUCKET);
    if (!bucket) {
      const { error: bErr } = await admin.storage.createBucket(BUCKET, { public: false });
      if (bErr) throw new Error(`createBucket failed: ${bErr.message}`);
    }

    // 2. Create admin + regular test users
    console.log("\nSetup: creating test users…");
    const adminUser = await createSignedInClient(ADMIN_EMAIL);
    const regularUser = await createSignedInClient(USER_EMAIL);
    createdUserIds.push(adminUser.userId, regularUser.userId);

    // Promote one to admin via service role
    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: adminUser.userId, role: "admin" });
    if (roleErr) throw new Error(`insert admin role failed: ${roleErr.message}`);

    // Seed an object so the non-admin SELECT test has something it should NOT see
    const { error: seedErr } = await admin.storage
      .from(BUCKET)
      .upload(SEED_PATH, new Blob(["seed"], { type: "text/plain" }), { upsert: true });
    if (seedErr) throw new Error(`seed upload failed: ${seedErr.message}`);

    // ---------------- Non-admin: every op must be blocked ----------------
    console.log("\nNon-admin user must be blocked on all operations:");
    {
      const c = regularUser.client;

      // SELECT (list) -> should return 0 visible objects
      const { data: listed } = await c.storage.from(BUCKET).list("rls-test", { limit: 1000 });
      assert((listed?.length ?? 0) === 0, "non-admin list returns 0 objects (RLS hides everything)");

      // INSERT (upload) -> must fail
      const { error: upErr } = await c.storage
        .from(BUCKET)
        .upload(USER_PATH, new Blob(["nope"], { type: "text/plain" }));
      assert(!!upErr, `non-admin upload is rejected (${upErr?.message ?? "no error"})`);

      // UPDATE (move/rename) -> must fail (no row visible to update)
      const { error: mvErr } = await c.storage.from(BUCKET).move(SEED_PATH, "rls-test/hacked.txt");
      assert(!!mvErr, `non-admin move is rejected (${mvErr?.message ?? "no error"})`);

      // DELETE (remove) -> Supabase returns no error but removes 0 rows because RLS hides them.
      const { data: removed, error: rmErr } = await c.storage.from(BUCKET).remove([SEED_PATH]);
      assert(!rmErr && (removed?.length ?? 0) === 0, "non-admin remove deletes 0 rows");

      // Sanity: seeded object still exists (admin view)
      const { data: stillThere } = await admin.storage.from(BUCKET).list("rls-test/" + SUFFIX);
      assert(
        !!stillThere?.some((o) => o.name === "seed.txt"),
        "seeded object survived non-admin attempts",
      );
    }

    // ---------------- Admin: every op must succeed ----------------
    console.log("\nAdmin user must be able to perform all operations:");
    {
      const c = adminUser.client;

      // SELECT
      const { data: listed, error: listErr } = await c.storage
        .from(BUCKET)
        .list("rls-test/" + SUFFIX, { limit: 100 });
      assert(!listErr && !!listed?.some((o) => o.name === "seed.txt"), "admin list sees seeded object");

      // INSERT
      const { error: upErr } = await c.storage
        .from(BUCKET)
        .upload(ADMIN_PATH, new Blob(["admin"], { type: "text/plain" }));
      assert(!upErr, `admin upload succeeds${upErr ? ` (got: ${upErr.message})` : ""}`);

      // UPDATE (rename via move)
      const { error: mvErr } = await c.storage.from(BUCKET).move(ADMIN_PATH, ADMIN_PATH_RENAMED);
      assert(!mvErr, `admin move succeeds${mvErr ? ` (got: ${mvErr.message})` : ""}`);

      // DELETE
      const { data: removed, error: rmErr } = await c.storage
        .from(BUCKET)
        .remove([ADMIN_PATH_RENAMED, SEED_PATH]);
      assert(!rmErr && (removed?.length ?? 0) >= 1, "admin remove deletes target rows");
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    failed++;
  } finally {
    // Cleanup: delete users (cascades user_roles); best-effort remove leftover objects
    console.log("\nCleanup…");
    try {
      await admin.storage.from(BUCKET).remove([SEED_PATH, ADMIN_PATH, ADMIN_PATH_RENAMED, USER_PATH]);
    } catch {}
    for (const uid of createdUserIds) {
      try { await admin.auth.admin.deleteUser(uid); } catch {}
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
