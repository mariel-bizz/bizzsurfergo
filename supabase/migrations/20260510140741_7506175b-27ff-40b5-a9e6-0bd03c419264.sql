
CREATE TABLE public.event_meet_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id integer NOT NULL UNIQUE,
  calendar_id text NOT NULL DEFAULT 'primary',
  google_event_id text NOT NULL,
  meet_link text,
  html_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_meet_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view meet links"
  ON public.event_meet_links FOR SELECT
  TO authenticated
  USING (true);  -- lovable:allow-open-rls (intentional public surface)

CREATE POLICY "Admins manage meet links"
  ON public.event_meet_links FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_event_meet_links_updated_at
  BEFORE UPDATE ON public.event_meet_links
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
