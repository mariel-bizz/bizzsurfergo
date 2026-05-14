-- Add Vault reference column for integration API keys
ALTER TABLE public.user_integrations
  ADD COLUMN IF NOT EXISTS config_secret_id uuid;

-- Remove any plaintext api_key that may have been stored in config JSONB
UPDATE public.user_integrations
  SET config = config - 'api_key'
  WHERE config ? 'api_key';

-- Securely set an integration API key in Vault, scoped to the calling user
CREATE OR REPLACE FUNCTION public.set_integration_api_key(_integration_id uuid, _key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  uid uuid := auth.uid();
  existing_id uuid;
  new_id uuid;
  prov text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _key IS NULL OR length(btrim(_key)) < 4 OR length(_key) > 500 THEN
    RAISE EXCEPTION 'Invalid key length';
  END IF;

  SELECT config_secret_id, provider INTO existing_id, prov
    FROM public.user_integrations
    WHERE id = _integration_id AND user_id = uid;

  IF prov IS NULL THEN
    RAISE EXCEPTION 'Integration not found';
  END IF;

  IF existing_id IS NOT NULL THEN
    PERFORM vault.update_secret(existing_id, _key, NULL, NULL);
  ELSE
    new_id := vault.create_secret(
      _key,
      'integration_api_key:' || _integration_id::text,
      'API key for integration ' || prov || ' (user ' || uid::text || ')'
    );
    UPDATE public.user_integrations
      SET config_secret_id = new_id, updated_at = now()
      WHERE id = _integration_id AND user_id = uid;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_integration_api_key(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_integration_api_key(uuid, text) TO authenticated;

-- Securely clear an integration API key
CREATE OR REPLACE FUNCTION public.clear_integration_api_key(_integration_id uuid)
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

  SELECT config_secret_id INTO existing_id
    FROM public.user_integrations
    WHERE id = _integration_id AND user_id = uid;

  IF existing_id IS NOT NULL THEN
    UPDATE public.user_integrations
      SET config_secret_id = NULL, updated_at = now()
      WHERE id = _integration_id AND user_id = uid;
    DELETE FROM vault.secrets WHERE id = existing_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_integration_api_key(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clear_integration_api_key(uuid) TO authenticated;