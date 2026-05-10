-- 1) Lock down insights_likes SELECT
DROP POLICY IF EXISTS "Anyone can view likes" ON public.insights_likes;

CREATE POLICY "Users view own like"
  ON public.insights_likes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all likes"
  ON public.insights_likes FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2) Public, aggregated like count (no PII)
CREATE OR REPLACE FUNCTION public.get_insights_like_count(_slug text)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::bigint FROM public.insights_likes WHERE article_slug = _slug;
$$;

GRANT EXECUTE ON FUNCTION public.get_insights_like_count(text) TO anon, authenticated;

-- 3) Stop comment authors from reading their own non-approved rows.
-- They get the moderation outcome in the INSERT response.
DROP POLICY IF EXISTS "Users can view own comments" ON public.insights_comments;