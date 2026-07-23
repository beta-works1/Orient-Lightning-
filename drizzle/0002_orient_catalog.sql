-- Orient Lighting catalog schema (dedicated project)
-- Includes products, collections, join table, blog, pages, dealers, newsletter

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  handle text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(12, 2) NOT NULL,
  compare_at_price numeric(12, 2),
  sku text NOT NULL DEFAULT '',
  product_type text NOT NULL DEFAULT '',
  vendor text NOT NULL DEFAULT 'Orient',
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  options jsonb DEFAULT '[]'::jsonb,
  tags jsonb DEFAULT '[]'::jsonb,
  facets jsonb DEFAULT '{"wattage":[],"colorTemp":[]}'::jsonb,
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collections (
  id text PRIMARY KEY,
  handle text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image text
);

CREATE TABLE IF NOT EXISTS product_collections (
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  collection_id text NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, collection_id)
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id text PRIMARY KEY,
  handle text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  published_at timestamptz,
  image text
);

CREATE TABLE IF NOT EXISTS pages (
  id text PRIMARY KEY,
  handle text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dealers (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  phone text,
  whatsapp text,
  hours text,
  verified boolean NOT NULL DEFAULT false,
  is_walk_in boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_status_idx ON products (status);
CREATE INDEX IF NOT EXISTS products_handle_idx ON products (handle);
CREATE INDEX IF NOT EXISTS collections_handle_idx ON collections (handle);

-- Storage bucket for admin product uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
