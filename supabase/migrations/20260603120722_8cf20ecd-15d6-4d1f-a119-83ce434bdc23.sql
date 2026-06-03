-- Prevent invite_token fixation: only the service role (and default value) may set invite_token.
REVOKE INSERT (invite_token), UPDATE (invite_token) ON public.team_members FROM authenticated;
REVOKE INSERT (invite_token), UPDATE (invite_token) ON public.team_members FROM anon;