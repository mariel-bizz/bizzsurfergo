
CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id integer NOT NULL,
  email text NOT NULL,
  event_title text NOT NULL,
  event_starts_at timestamptz NOT NULL,
  event_location text,
  event_href text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own rsvps" ON public.event_rsvps
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own rsvps" ON public.event_rsvps
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own rsvps" ON public.event_rsvps
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all rsvps" ON public.event_rsvps
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_event_rsvps_starts_at ON public.event_rsvps (event_starts_at);

CREATE TABLE public.event_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rsvp_id uuid NOT NULL REFERENCES public.event_rsvps(id) ON DELETE CASCADE,
  reminder_kind text NOT NULL CHECK (reminder_kind IN ('24h','1h')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rsvp_id, reminder_kind)
);

ALTER TABLE public.event_reminder_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view reminder log" ON public.event_reminder_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
