-- Marketplace inquiries: capture install/request/download intent per listing
CREATE TABLE public.marketplace_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text NOT NULL,
  listing_title text NOT NULL,
  listing_category text NOT NULL,
  action_type text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  company text,
  message text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketplace_inquiries_action_type_chk
    CHECK (action_type IN ('install','request','download')),
  CONSTRAINT marketplace_inquiries_category_chk
    CHECK (listing_category IN ('agents','services','templates')),
  CONSTRAINT marketplace_inquiries_email_chk
    CHECK (char_length(email) BETWEEN 3 AND 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT marketplace_inquiries_name_chk
    CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  CONSTRAINT marketplace_inquiries_company_chk
    CHECK (company IS NULL OR char_length(company) <= 160),
  CONSTRAINT marketplace_inquiries_message_chk
    CHECK (message IS NULL OR char_length(message) <= 1000),
  CONSTRAINT marketplace_inquiries_listing_id_chk
    CHECK (char_length(listing_id) BETWEEN 1 AND 80),
  CONSTRAINT marketplace_inquiries_listing_title_chk
    CHECK (char_length(listing_title) BETWEEN 1 AND 200)
);

CREATE INDEX idx_marketplace_inquiries_created_at
  ON public.marketplace_inquiries (created_at DESC);
CREATE INDEX idx_marketplace_inquiries_listing_id
  ON public.marketplace_inquiries (listing_id);

ALTER TABLE public.marketplace_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can submit an inquiry — public capture surface,
-- mirrors the existing waitlist pattern.
CREATE POLICY "Anyone can submit marketplace inquiry"
  ON public.marketplace_inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);  -- lovable:allow-open-rls (intentional public surface)

-- Only admins can read inquiries.
CREATE POLICY "Admins view marketplace inquiries"
  ON public.marketplace_inquiries
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
