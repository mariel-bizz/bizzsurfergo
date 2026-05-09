-- Automated RLS test for the private 'storage' bucket.
-- Verifies that only users with the 'admin' role can SELECT, INSERT,
-- UPDATE, or DELETE objects in bucket_id = 'storage'.
--
-- Runs entirely in a transaction and ROLLBACKs at the end, leaving no
-- residual data. Run with:
--   psql -v ON_ERROR_STOP=1 -f tests/storage_rls_test.sql
--
-- Exit code 0 = all assertions passed.

\set ON_ERROR_STOP on
\timing off

BEGIN;

-- ---------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------
INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-0000000a11ce'),  -- admin test user
  ('00000000-0000-0000-0000-0000000b0b00'); -- regular test user

INSERT INTO public.user_roles (user_id, role) VALUES
  ('00000000-0000-0000-0000-0000000a11ce', 'admin'),
  ('00000000-0000-0000-0000-0000000b0b00', 'user');

INSERT INTO storage.buckets (id, name, public)
VALUES ('storage', 'storage', false)
ON CONFLICT (id) DO NOTHING;

-- Seed an object as superuser so non-admins have something to "see".
INSERT INTO storage.objects (bucket_id, name, owner)
VALUES ('storage', 'rls-test/seed.txt', '00000000-0000-0000-0000-0000000a11ce');

-- pg_temp.assert helper
CREATE OR REPLACE FUNCTION pg_temp.assert(cond boolean, msg text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT cond THEN
    RAISE EXCEPTION 'ASSERT FAILED: %', msg;
  END IF;
  RAISE NOTICE 'PASS: %', msg;
END $$;

-- ---------------------------------------------------------------
-- Non-admin user: should be blocked from every operation
-- ---------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" =
  '{"sub":"00000000-0000-0000-0000-0000000b0b00","role":"authenticated"}';

-- SELECT: must return 0 rows
SELECT pg_temp.assert(
  (SELECT count(*) FROM storage.objects WHERE bucket_id = 'storage') = 0,
  'non-admin SELECT on storage bucket returns 0 rows'
);

-- INSERT: must raise insufficient_privilege (RLS WITH CHECK violation)
DO $$
BEGIN
  BEGIN
    INSERT INTO storage.objects (bucket_id, name, owner)
    VALUES ('storage', 'rls-test/should-fail.txt',
            '00000000-0000-0000-0000-0000000b0b00');
    RAISE EXCEPTION 'ASSERT FAILED: non-admin INSERT was not blocked';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: non-admin INSERT blocked by RLS';
  END;
END $$;

-- UPDATE: USING clause filters to 0 rows -> 0 rows updated
WITH u AS (
  UPDATE storage.objects SET name = 'rls-test/hacked.txt'
  WHERE bucket_id = 'storage' RETURNING 1
)
SELECT pg_temp.assert(
  (SELECT count(*) FROM u) = 0,
  'non-admin UPDATE on storage bucket affects 0 rows'
);

-- DELETE: same — USING filters to 0 rows
WITH d AS (
  DELETE FROM storage.objects WHERE bucket_id = 'storage' RETURNING 1
)
SELECT pg_temp.assert(
  (SELECT count(*) FROM d) = 0,
  'non-admin DELETE on storage bucket affects 0 rows'
);

-- ---------------------------------------------------------------
-- Admin user: should be able to do everything
-- ---------------------------------------------------------------
SET LOCAL "request.jwt.claims" =
  '{"sub":"00000000-0000-0000-0000-0000000a11ce","role":"authenticated"}';

-- SELECT
SELECT pg_temp.assert(
  (SELECT count(*) FROM storage.objects
   WHERE bucket_id = 'storage' AND name = 'rls-test/seed.txt') = 1,
  'admin SELECT sees seeded object'
);

-- INSERT
INSERT INTO storage.objects (bucket_id, name, owner)
VALUES ('storage', 'rls-test/admin-new.txt',
        '00000000-0000-0000-0000-0000000a11ce');
SELECT pg_temp.assert(
  (SELECT count(*) FROM storage.objects
   WHERE name = 'rls-test/admin-new.txt') = 1,
  'admin INSERT succeeds'
);

-- UPDATE
UPDATE storage.objects SET name = 'rls-test/admin-renamed.txt'
WHERE name = 'rls-test/admin-new.txt';
SELECT pg_temp.assert(
  (SELECT count(*) FROM storage.objects
   WHERE name = 'rls-test/admin-renamed.txt') = 1,
  'admin UPDATE succeeds'
);

-- DELETE
DELETE FROM storage.objects WHERE name = 'rls-test/admin-renamed.txt';
SELECT pg_temp.assert(
  (SELECT count(*) FROM storage.objects
   WHERE name = 'rls-test/admin-renamed.txt') = 0,
  'admin DELETE succeeds'
);

-- ---------------------------------------------------------------
-- Cleanup: rollback the whole fixture so nothing persists
-- ---------------------------------------------------------------
RESET ROLE;
ROLLBACK;

\echo ''
\echo '======================================================'
\echo ' All storage bucket RLS assertions passed.'
\echo '======================================================'
