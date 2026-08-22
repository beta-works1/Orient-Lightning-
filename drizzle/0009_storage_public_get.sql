-- 0005 dropped listing SELECT on public buckets (lint 0025: public_bucket_allows_listing).
-- Public buckets serve GET /storage/v1/object/public/<bucket>/<path> without a SELECT
-- policy. Do not re-add a bucket-wide SELECT on product-images.
-- Keep the buckets public so storefront + admin previews keep working on a fresh DB.

UPDATE storage.buckets
SET public = true
WHERE id IN ('product-images', 'catalogues');
