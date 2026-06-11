
-- event_waitlist
CREATE TABLE IF NOT EXISTS public.event_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id integer NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  converted_at timestamptz,
  UNIQUE (user_id, event_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_waitlist TO authenticated;
GRANT ALL ON public.event_waitlist TO service_role;
ALTER TABLE public.event_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own waitlist" ON public.event_waitlist
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all waitlist" ON public.event_waitlist
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS event_waitlist_event_id_idx ON public.event_waitlist(event_id);

-- user_notifications (in-app)
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_notifications TO service_role;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.user_notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.user_notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.user_notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS user_notifications_user_idx ON public.user_notifications(user_id, created_at DESC);

-- quota_notification_log (dedupes "last slot", "exhausted", "reset" emails per period)
CREATE TABLE IF NOT EXISTS public.quota_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL, -- 'last_slot' | 'exhausted' | 'reset'
  period_key text NOT NULL, -- e.g. '2026-06' or '2026'
  tier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, period_key)
);
GRANT SELECT ON public.quota_notification_log TO authenticated;
GRANT ALL ON public.quota_notification_log TO service_role;
ALTER TABLE public.quota_notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own quota notif log" ON public.quota_notification_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all quota notif log" ON public.quota_notification_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- quota_enforcement_log (admin audit)
CREATE TABLE IF NOT EXISTS public.quota_enforcement_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  decision text NOT NULL, -- 'allow' | 'deny' | 'waitlist'
  reason text,
  tier text NOT NULL,
  period text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  used integer NOT NULL,
  quota_limit integer,
  event_id integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quota_enforcement_log TO authenticated;
GRANT ALL ON public.quota_enforcement_log TO service_role;
ALTER TABLE public.quota_enforcement_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read enforcement log" ON public.quota_enforcement_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS quota_enforcement_log_user_idx ON public.quota_enforcement_log(user_id, created_at DESC);
