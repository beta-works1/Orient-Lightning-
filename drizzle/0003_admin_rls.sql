-- Admin write policies (authenticated JWT email must match app.admin_email)
-- Set admin email once in SQL editor:
--   ALTER DATABASE postgres SET app.admin_email = 'your@email.com';
-- Or per-session: SELECT set_config('app.admin_email', 'your@email.com', false);

DROP POLICY IF EXISTS "Admin insert products" ON products;
DROP POLICY IF EXISTS "Admin update products" ON products;
DROP POLICY IF EXISTS "Admin delete products" ON products;

CREATE POLICY "Admin insert products" ON products
  FOR INSERT TO authenticated
  WITH CHECK (
    lower(coalesce(auth.jwt() ->> 'email', ''))
      = lower(nullif(current_setting('app.admin_email', true), ''))
  );

CREATE POLICY "Admin update products" ON products
  FOR UPDATE TO authenticated
  USING (
    lower(coalesce(auth.jwt() ->> 'email', ''))
      = lower(nullif(current_setting('app.admin_email', true), ''))
  )
  WITH CHECK (
    lower(coalesce(auth.jwt() ->> 'email', ''))
      = lower(nullif(current_setting('app.admin_email', true), ''))
  );

CREATE POLICY "Admin delete products" ON products
  FOR DELETE TO authenticated
  USING (
    lower(coalesce(auth.jwt() ->> 'email', ''))
      = lower(nullif(current_setting('app.admin_email', true), ''))
  );
