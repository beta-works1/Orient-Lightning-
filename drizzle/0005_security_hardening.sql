-- Security hardening: published-only public product reads, newsletter policies,
-- admin write policies, revoke public EXECUTE on rls_auto_enable, drop storage listing.

DROP POLICY IF EXISTS "Public read products" ON products;
CREATE POLICY "Public read products" ON products
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "Admin read all products" ON products;
CREATE POLICY "Admin read all products" ON products
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

DROP POLICY IF EXISTS "Admin write site_settings" ON site_settings;
CREATE POLICY "Admin write site_settings" ON site_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

DROP POLICY IF EXISTS "Admin write product_collections" ON product_collections;
CREATE POLICY "Admin write product_collections" ON product_collections
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND char_length(email) <= 254
  );

DROP POLICY IF EXISTS "Admin read newsletter" ON newsletter_subscribers;
CREATE POLICY "Admin read newsletter" ON newsletter_subscribers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

DROP POLICY IF EXISTS "Admin delete newsletter" ON newsletter_subscribers;
CREATE POLICY "Admin delete newsletter" ON newsletter_subscribers
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM authenticated;

DROP POLICY IF EXISTS "Public read catalogues" ON storage.objects;
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
