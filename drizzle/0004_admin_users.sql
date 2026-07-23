-- Admin allowlist (mirrors Supabase Auth user)
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read admin_users" ON admin_users;
CREATE POLICY "Admins can read admin_users" ON admin_users
  FOR SELECT TO authenticated
  USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

GRANT SELECT ON admin_users TO authenticated;
GRANT ALL ON admin_users TO service_role;

-- Product writes: authenticated admin_users only
DROP POLICY IF EXISTS "Admin insert products" ON products;
DROP POLICY IF EXISTS "Admin update products" ON products;
DROP POLICY IF EXISTS "Admin delete products" ON products;

CREATE POLICY "Admin insert products" ON products
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

CREATE POLICY "Admin update products" ON products
  FOR UPDATE TO authenticated
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

CREATE POLICY "Admin delete products" ON products
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );
