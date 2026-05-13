
-- Fix 1: event_meet_links — restrict SELECT to RSVP'd users + admins
DROP POLICY IF EXISTS "Authenticated can view meet links" ON public.event_meet_links;

CREATE POLICY "RSVP'd users view their event meet link"
ON public.event_meet_links
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.event_rsvps r
    WHERE r.event_id = event_meet_links.event_id
      AND r.user_id = auth.uid()
  )
);

-- Fix 2: user_ai_settings — remove admin access to BYOK API keys
DROP POLICY IF EXISTS "Admins view all ai settings" ON public.user_ai_settings;

-- Fix 3: insights_comments — clear internal moderation notes on approved rows
UPDATE public.insights_comments
SET moderation_reason = NULL
WHERE status = 'approved' AND moderation_reason IS NOT NULL;

-- Update trigger to never store a moderation_reason on approved rows
CREATE OR REPLACE FUNCTION public.moderate_insights_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  bad_pattern text := '\m(fuck|shit|bitch|cunt|asshole|nigger|faggot|retard|kill\s+yourself|kys|die\s+in\s+a\s+fire|scam(mer)?s?|fraud(ster)?s?|garbage|trash|worthless|useless|hate\s+(this|you|them)|stupid|idiot|moron)\M';
  body_lower text := lower(coalesce(NEW.body, ''));
BEGIN
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
