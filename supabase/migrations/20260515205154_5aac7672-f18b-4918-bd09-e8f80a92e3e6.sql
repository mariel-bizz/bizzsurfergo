
CREATE TABLE public.digest_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX digest_subscribers_email_lower_unique
  ON public.digest_subscribers (lower(email));

ALTER TABLE public.digest_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to digest"
  ON public.digest_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(email) >= 3
    AND length(email) <= 320
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (source IS NULL OR length(source) <= 100)
  );

CREATE POLICY "Admins can view digest subscribers"
  ON public.digest_subscribers
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update digest subscribers"
  ON public.digest_subscribers
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete digest subscribers"
  ON public.digest_subscribers
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
