-- Track outbound clicks (e.g., splash logo to bizzsurfer.com)
CREATE TABLE public.outbound_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  user_id UUID,
  referrer TEXT,
  user_agent TEXT,
  path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_outbound_clicks_source_created ON public.outbound_clicks (source, created_at DESC);
CREATE INDEX idx_outbound_clicks_destination ON public.outbound_clicks (destination);

ALTER TABLE public.outbound_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous visitors) can log a click
CREATE POLICY "Anyone can log outbound clicks"
ON public.outbound_clicks
FOR INSERT
WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Admins can view outbound clicks"
ON public.outbound_clicks
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));