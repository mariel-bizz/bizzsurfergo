-- 1) Restrict column-level access to market_news.body
REVOKE SELECT (body) ON public.market_news FROM anon;
REVOKE SELECT (body) ON public.market_news FROM authenticated;

-- 2) Drop the loose invitee UPDATE policy on team_members.
-- Invite acceptance flows through requestTeamJoin server fn which uses
-- supabaseAdmin and validates the invite_token explicitly.
DROP POLICY IF EXISTS "Invitee accepts own invite" ON public.team_members;