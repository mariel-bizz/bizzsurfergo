-- 1. Add new column for Vault secret reference
ALTER TABLE public.user_ai_settings
  ADD COLUMN IF NOT EXISTS byok_secret_id uuid;

-- 2. Migrate any existing plain-text keys into Vault
DO $$
DECLARE
  r RECORD;
  new_id uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='user_ai_settings' AND column_name='byok_api_key'
  ) THEN
    FOR r IN
      EXECUTE 'SELECT user_id, byok_api_key FROM public.user_ai_settings
               WHERE byok_api_key IS NOT NULL AND byok_secret_id IS NULL'
    LOOP
      new_id := vault.create_secret(
        r.byok_api_key,
        'byok_api_key:' || r.user_id::text,
        'BYOK provider API key for user ' || r.user_id::text
      );
      UPDATE public.user_ai_settings SET byok_secret_id = new_id WHERE user_id = r.user_id;
    END LOOP;
  END IF;
END $$;

-- 3. Drop the plain-text column
ALTER TABLE public.user_ai_settings DROP COLUMN IF EXISTS byok_api_key;

-- 4. Setter: signed-in user stores or rotates their own BYOK key in Vault.
CREATE OR REPLACE FUNCTION public.set_user_byok_key(_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  uid uuid := auth.uid();
  existing_id uuid;
  new_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _key IS NULL OR length(btrim(_key)) < 8 OR length(_key) > 400 THEN
    RAISE EXCEPTION 'Invalid key length';
  END IF;

  SELECT byok_secret_id INTO existing_id
    FROM public.user_ai_settings WHERE user_id = uid;

  IF existing_id IS NOT NULL THEN
    PERFORM vault.update_secret(existing_id, _key, NULL, NULL);
  ELSE
    new_id := vault.create_secret(
      _key,
      'byok_api_key:' || uid::text,
      'BYOK provider API key for user ' || uid::text
    );
    INSERT INTO public.user_ai_settings (user_id, byok_secret_id)
      VALUES (uid, new_id)
      ON CONFLICT (user_id) DO UPDATE SET byok_secret_id = EXCLUDED.byok_secret_id, updated_at = now();
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_byok_key(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_byok_key(text) TO authenticated;

-- 5. Clearer: signed-in user removes their BYOK key.
CREATE OR REPLACE FUNCTION public.clear_user_byok_key()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  uid uuid := auth.uid();
  existing_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT byok_secret_id INTO existing_id
    FROM public.user_ai_settings WHERE user_id = uid;
  IF existing_id IS NOT NULL THEN
    UPDATE public.user_ai_settings SET byok_secret_id = NULL, updated_at = now() WHERE user_id = uid;
    DELETE FROM vault.secrets WHERE id = existing_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_user_byok_key() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clear_user_byok_key() TO authenticated;