
CREATE TABLE IF NOT EXISTS public.admin_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_alerts_created_at_idx ON public.admin_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_alerts_kind_created_idx ON public.admin_alerts (kind, created_at DESC);

ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view alerts"
  ON public.admin_alerts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update alerts"
  ON public.admin_alerts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
