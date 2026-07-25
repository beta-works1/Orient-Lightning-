-- Site catalogue settings + public catalogues storage bucket
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read site settings" ON site_settings;
CREATE POLICY "Public read site settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO site_settings (key, value)
VALUES (
  'catalogue',
  jsonb_build_object(
    'enabled', true,
    'url', '/orient-lighting-catalogue.pdf',
    'filename', 'Orient-Lighting-Catalogue.pdf',
    'storagePath', null
  )
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('catalogues', 'catalogues', true)
ON CONFLICT (id) DO NOTHING;
