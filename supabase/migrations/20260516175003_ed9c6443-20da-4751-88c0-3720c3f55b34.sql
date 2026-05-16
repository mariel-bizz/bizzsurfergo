
-- Applications table
CREATE TABLE public.marketplace_listing_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  public_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company text,
  offering_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  website text,
  status text NOT NULL DEFAULT 'pending',
  review_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  user_agent text,
  source text,
  CONSTRAINT mla_name_chk CHECK (char_length(btrim(name)) BETWEEN 1 AND 200),
  CONSTRAINT mla_email_chk CHECK (char_length(email) BETWEEN 3 AND 320 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT mla_company_chk CHECK (company IS NULL OR char_length(company) <= 200),
  CONSTRAINT mla_offering_chk CHECK (offering_type IN ('Agent','Service','Playbook','Template','Other')),
  CONSTRAINT mla_title_chk CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  CONSTRAINT mla_description_chk CHECK (char_length(description) BETWEEN 10 AND 5000),
  CONSTRAINT mla_website_chk CHECK (website IS NULL OR char_length(website) <= 500),
  CONSTRAINT mla_status_chk CHECK (status IN ('pending','approved','rejected')),
  CONSTRAINT mla_review_notes_chk CHECK (review_notes IS NULL OR char_length(review_notes) <= 5000),
  CONSTRAINT mla_user_agent_chk CHECK (user_agent IS NULL OR char_length(user_agent) <= 1024),
  CONSTRAINT mla_source_chk CHECK (source IS NULL OR char_length(source) <= 100)
);

CREATE INDEX idx_mla_created_at ON public.marketplace_listing_applications (created_at DESC);
CREATE INDEX idx_mla_status ON public.marketplace_listing_applications (status);
CREATE INDEX idx_mla_email ON public.marketplace_listing_applications (lower(email));

ALTER TABLE public.marketplace_listing_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application (input is server-validated again)
CREATE POLICY "Anyone can submit listing application"
  ON public.marketplace_listing_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND review_notes IS NULL
    AND reviewed_at IS NULL
    AND reviewed_by IS NULL
  );

-- Admins can view all applications
CREATE POLICY "Admins view listing applications"
  ON public.marketplace_listing_applications
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update (review) applications
CREATE POLICY "Admins update listing applications"
  ON public.marketplace_listing_applications
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE TRIGGER trg_mla_touch_updated_at
  BEFORE UPDATE ON public.marketplace_listing_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Public status lookup by secret token
CREATE OR REPLACE FUNCTION public.get_listing_application_status(_token uuid)
RETURNS TABLE (
  status text,
  title text,
  offering_type text,
  created_at timestamptz,
  updated_at timestamptz,
  review_notes text,
  reviewed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.status,
    a.title,
    a.offering_type,
    a.created_at,
    a.updated_at,
    a.review_notes,
    a.reviewed_at
  FROM public.marketplace_listing_applications a
  WHERE a.public_token = _token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_listing_application_status(uuid) TO anon, authenticated;
