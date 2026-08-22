-- Partner applications: public REST must not read or write.
-- Inserts go through the Next.js server action (service role). Admins read via
-- the existing SELECT policy (authenticated + admin_users) or the admin inbox
-- (service role).

REVOKE ALL ON TABLE public.partner_applications FROM anon;
REVOKE ALL ON TABLE public.partner_applications FROM authenticated;

GRANT SELECT ON TABLE public.partner_applications TO authenticated;
GRANT SELECT, INSERT ON TABLE public.partner_applications TO service_role;
