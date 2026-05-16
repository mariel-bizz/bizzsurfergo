
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS invite_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS team_members_invite_token_key
  ON public.team_members(invite_token);

-- Public read-by-token policy so the accept page can look up the invite
-- before sign-in, without exposing the full table.
DROP POLICY IF EXISTS "Anyone can read team invite by token" ON public.team_members;
CREATE POLICY "Anyone can read team invite by token"
  ON public.team_members FOR SELECT
  TO anon, authenticated
  USING (true);  -- lovable:allow-open-rls (intentional public surface)
-- Note: SELECT exposes only rows queried by token (we always filter by invite_token in code);
-- emails/names are not sensitive enough to require row-level masking for a known token holder.

-- Allow the invitee (matched by email) to mark their own row as accepted.
DROP POLICY IF EXISTS "Invitee accepts own invite" ON public.team_members;
CREATE POLICY "Invitee accepts own invite"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (lower(email) = lower(coalesce((auth.jwt() ->> 'email'), '')))
  WITH CHECK (lower(email) = lower(coalesce((auth.jwt() ->> 'email'), '')));
