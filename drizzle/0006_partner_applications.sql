-- Partner / distributor applications from Become Our Partner form

CREATE TABLE IF NOT EXISTS partner_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_person_name text NOT NULL,
  designation text NOT NULL,
  mobile_number text NOT NULL,
  email_address text NOT NULL,
  city text NOT NULL,
  business_type text NOT NULL,
  years_in_business text NOT NULL,
  led_experience text NOT NULL,
  areas_served text NOT NULL,
  average_sales_revenue text NOT NULL,
  why_partner text NOT NULL,
  additional_comments text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_applications_created_at_idx
  ON partner_applications (created_at DESC);

ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read partner applications" ON partner_applications;
CREATE POLICY "Admin read partner applications" ON partner_applications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );
