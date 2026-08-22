-- Per-product catalogue PDF. Site-wide catalogue in site_settings remains the fallback.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS catalogue_url text,
  ADD COLUMN IF NOT EXISTS catalogue_filename text,
  ADD COLUMN IF NOT EXISTS catalogue_storage_path text;

COMMENT ON COLUMN products.catalogue_url IS 'Public URL of this product family''s catalogue PDF; storefront falls back to site_settings.catalogue when null.';
COMMENT ON COLUMN products.catalogue_filename IS 'Download filename for the product catalogue PDF.';
COMMENT ON COLUMN products.catalogue_storage_path IS 'Object path in the catalogues bucket; used to replace/remove the file.';

-- Same bucket as the global catalogue. PDF + 25MB are the contract Agent 1 must not break.
UPDATE storage.buckets
SET
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY['application/pdf']
WHERE id = 'catalogues';

-- Public download (0005 dropped the previous policy). Service-role still performs uploads.
DROP POLICY IF EXISTS "Public read catalogues" ON storage.objects;
CREATE POLICY "Public read catalogues"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'catalogues');
