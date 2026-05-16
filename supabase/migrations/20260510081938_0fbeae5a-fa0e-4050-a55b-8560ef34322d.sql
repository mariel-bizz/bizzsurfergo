-- LIKES
CREATE TABLE public.insights_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_slug text NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  position text,
  company text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (article_slug, user_id)
);
CREATE INDEX insights_likes_slug_idx ON public.insights_likes(article_slug);
ALTER TABLE public.insights_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON public.insights_likes FOR SELECT
  TO anon, authenticated
  USING (true);  -- lovable:allow-open-rls (intentional public surface)

CREATE POLICY "Users can like as themselves"
  ON public.insights_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own like"
  ON public.insights_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- COMMENTS
CREATE TABLE public.insights_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_slug text NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  position text,
  company text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'approved',
  moderation_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX insights_comments_slug_idx ON public.insights_comments(article_slug, created_at DESC);
ALTER TABLE public.insights_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved comments"
  ON public.insights_comments FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Users can view own comments"
  ON public.insights_comments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all comments"
  ON public.insights_comments FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can comment as themselves"
  ON public.insights_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND length(body) BETWEEN 1 AND 2000);

CREATE POLICY "Users can delete own comment"
  ON public.insights_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
  ON public.insights_comments FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update comments"
  ON public.insights_comments FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- AUTO-MODERATION TRIGGER
CREATE OR REPLACE FUNCTION public.moderate_insights_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE TRIGGER insights_comments_moderate
  BEFORE INSERT ON public.insights_comments
  FOR EACH ROW EXECUTE FUNCTION public.moderate_insights_comment();