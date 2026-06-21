CREATE TABLE IF NOT EXISTS public.saved_insights (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, slug)
);

GRANT SELECT, INSERT, DELETE ON public.saved_insights TO authenticated;
GRANT ALL ON public.saved_insights TO service_role;

ALTER TABLE public.saved_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their saved insights" ON public.saved_insights
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users save insights" ON public.saved_insights
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unsave insights" ON public.saved_insights
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS saved_insights_user_idx ON public.saved_insights(user_id, created_at DESC);