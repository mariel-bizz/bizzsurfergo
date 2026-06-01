CREATE TABLE public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL,
  company text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  topic text NOT NULL,
  message text NOT NULL,
  user_agent text,
  ip_hint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_submissions TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_submissions TO authenticated;
GRANT ALL ON public.contact_submissions TO service_role;

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact message"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true); -- lovable:allow-open-rls

CREATE POLICY "Admins can view contact submissions"
  ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update contact submissions"
  ON public.contact_submissions
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete contact submissions"
  ON public.contact_submissions
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions (created_at DESC);
