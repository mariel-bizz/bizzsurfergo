
-- =========================================================
-- 1. Tighten "always true" INSERT policies with input checks
-- =========================================================

-- waitlist: require non-empty + length-bounded name/email/etc., basic email format
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
CREATE POLICY "Anyone can join waitlist"
ON public.waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(name)) BETWEEN 1 AND 200
  AND length(email) BETWEEN 3 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (role IS NULL OR length(role) <= 200)
  AND (company IS NULL OR length(company) <= 200)
);

-- marketplace_inquiries: require sane lengths + email format + sane action types
DROP POLICY IF EXISTS "Anyone can submit marketplace inquiry" ON public.marketplace_inquiries;
CREATE POLICY "Anyone can submit marketplace inquiry"
ON public.marketplace_inquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(name)) BETWEEN 1 AND 200
  AND length(email) BETWEEN 3 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(listing_id) BETWEEN 1 AND 200
  AND length(listing_title) BETWEEN 1 AND 500
  AND length(listing_category) BETWEEN 1 AND 100
  AND action_type IN ('inquiry','contact','quote','demo','buy','sell','rent','interest','other')
  AND (company IS NULL OR length(company) <= 200)
  AND (message IS NULL OR length(message) <= 5000)
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- outbound_clicks: require sane source/destination, length-bounded fields
DROP POLICY IF EXISTS "Anyone can log outbound clicks" ON public.outbound_clicks;
CREATE POLICY "Anyone can log outbound clicks"
ON public.outbound_clicks
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(source) BETWEEN 1 AND 100
  AND length(destination) BETWEEN 1 AND 2048
  AND (path IS NULL OR length(path) <= 2048)
  AND (referrer IS NULL OR length(referrer) <= 2048)
  AND (user_agent IS NULL OR length(user_agent) <= 1024)
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- =========================================================
-- 2. Lock down EXECUTE on SECURITY DEFINER functions
-- =========================================================

-- has_role: only authenticated need it (used inside RLS evaluated as the caller)
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- has_active_subscription: only authenticated callers need it
REVOKE ALL ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;

-- get_insights_like_count: public like counter, allow anon + authenticated only
REVOKE ALL ON FUNCTION public.get_insights_like_count(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_insights_like_count(text) TO anon, authenticated;

-- get_team_invite: invite acceptance can be reached by anon (before login) and authenticated
REVOKE ALL ON FUNCTION public.get_team_invite(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_invite(uuid) TO anon, authenticated;

-- touch_updated_at: trigger-only, no client should call it
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- pgmq helpers: server-only (service_role uses them via createServerFn)
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb)             FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint)              FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb)  FROM PUBLIC, anon, authenticated;

-- =========================================================
-- 3. Harden moderate_insights_comment so it can only run as a trigger
-- =========================================================

CREATE OR REPLACE FUNCTION public.moderate_insights_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  bad_pattern text := '\m(fuck|shit|bitch|cunt|asshole|nigger|faggot|retard|kill\s+yourself|kys|die\s+in\s+a\s+fire|scam(mer)?s?|fraud(ster)?s?|garbage|trash|worthless|useless|hate\s+(this|you|them)|stupid|idiot|moron)\M';
  body_lower text;
BEGIN
  -- Refuse direct invocation: must run inside a trigger on insights_comments
  IF TG_OP IS NULL OR TG_TABLE_SCHEMA <> 'public' OR TG_TABLE_NAME <> 'insights_comments' THEN
    RAISE EXCEPTION 'moderate_insights_comment() may only be called as a trigger on public.insights_comments';
  END IF;

  body_lower := lower(coalesce(NEW.body, ''));
  IF body_lower ~ bad_pattern THEN
    NEW.status := 'rejected';
    NEW.moderation_reason := 'auto: contains negative or abusive language';
  ELSE
    NEW.status := 'approved';
    NEW.moderation_reason := NULL;
  END IF;
  RETURN NEW;
END;
$function$;

-- Make absolutely sure no role outside the table owner can call it
REVOKE ALL ON FUNCTION public.moderate_insights_comment() FROM PUBLIC, anon, authenticated;
