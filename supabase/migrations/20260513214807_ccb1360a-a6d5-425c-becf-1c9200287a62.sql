-- Tighten insights_comments INSERT policy
DROP POLICY IF EXISTS "Users can comment as themselves" ON public.insights_comments;
CREATE POLICY "Users can comment as themselves"
ON public.insights_comments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND length(body) BETWEEN 1 AND 2000
  AND length(btrim(name)) BETWEEN 1 AND 120
  AND (position IS NULL OR length(btrim(position)) <= 120)
  AND (company IS NULL OR length(btrim(company)) <= 120)
  AND length(article_slug) BETWEEN 1 AND 200
);

-- Tighten insights_likes INSERT policy
DROP POLICY IF EXISTS "Users can like as themselves" ON public.insights_likes;
CREATE POLICY "Users can like as themselves"
ON public.insights_likes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND length(btrim(name)) BETWEEN 1 AND 120
  AND (position IS NULL OR length(btrim(position)) <= 120)
  AND (company IS NULL OR length(btrim(company)) <= 120)
  AND length(article_slug) BETWEEN 1 AND 200
);