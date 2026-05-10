
DROP POLICY IF EXISTS "Anyone can read team invite by token" ON public.team_members;

CREATE OR REPLACE FUNCTION public.get_team_invite(_token uuid)
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  role text,
  status text,
  invited_at timestamptz,
  accepted_at timestamptz,
  owner_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email, name, role, status, invited_at, accepted_at, owner_id
  FROM public.team_members
  WHERE invite_token = _token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_team_invite(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_invite(uuid) TO anon, authenticated;
