
CREATE TABLE public.visitor_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  user_agent text,
  user_id uuid,
  language text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.visitor_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a visit"
ON public.visitor_log
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(path) >= 1 AND length(path) <= 2048
  AND (referrer IS NULL OR length(referrer) <= 2048)
  AND (user_agent IS NULL OR length(user_agent) <= 1024)
  AND (language IS NULL OR length(language) <= 16)
  AND (user_id IS NULL OR user_id = auth.uid())
);

CREATE POLICY "Admins can view visitor log"
ON public.visitor_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_visitor_log_created_at ON public.visitor_log (created_at DESC);
