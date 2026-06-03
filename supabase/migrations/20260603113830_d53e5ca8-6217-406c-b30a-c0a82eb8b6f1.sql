
-- 1. Add avatar_url to user_preferences for storing profile picture (e.g. from LinkedIn)
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Public-safe RPC returning attendee count + a small sample of avatar URLs per event.
-- SECURITY DEFINER so it can read event_rsvps + user_preferences without exposing identities.
CREATE OR REPLACE FUNCTION public.get_event_attendee_summary(_event_ids int[])
RETURNS TABLE(event_id int, attendee_count bigint, avatars text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH counts AS (
    SELECT r.event_id, COUNT(*)::bigint AS c
    FROM public.event_rsvps r
    WHERE r.event_id = ANY(_event_ids)
    GROUP BY r.event_id
  ),
  sampled AS (
    SELECT r.event_id, p.avatar_url,
           row_number() OVER (PARTITION BY r.event_id ORDER BY r.created_at DESC) AS rn
    FROM public.event_rsvps r
    LEFT JOIN public.user_preferences p ON p.user_id = r.user_id
    WHERE r.event_id = ANY(_event_ids)
      AND p.avatar_url IS NOT NULL
      AND length(p.avatar_url) > 0
  ),
  avs AS (
    SELECT event_id, array_agg(avatar_url ORDER BY rn) AS avatars
    FROM sampled
    WHERE rn <= 5
    GROUP BY event_id
  )
  SELECT
    e.event_id,
    COALESCE(c.c, 0)::bigint AS attendee_count,
    COALESCE(a.avatars, ARRAY[]::text[]) AS avatars
  FROM unnest(_event_ids) AS e(event_id)
  LEFT JOIN counts c ON c.event_id = e.event_id
  LEFT JOIN avs    a ON a.event_id = e.event_id;
$$;

REVOKE ALL ON FUNCTION public.get_event_attendee_summary(int[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_event_attendee_summary(int[]) TO anon, authenticated;
