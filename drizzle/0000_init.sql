-- Orient Lighting initial schema
-- Apply to a DEDICATED Supabase project (not shared with other apps)

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  handle text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(12, 2) NOT NULL,
  compare_at_price numeric(12, 2),
  sku text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  options jsonb DEFAULT '[]'::jsonb,
  tags jsonb DEFAULT '[]'::jsonb,
  facets jsonb DEFAULT '{"wattage":[],"colorTemp":[]}'::jsonb,
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
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

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public read for catalog tables
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read collections" ON collections FOR SELECT USING (true);
CREATE POLICY "Public read product_collections" ON product_collections FOR SELECT USING (true);
CREATE POLICY "Public read blog_posts" ON blog_posts FOR SELECT USING (true);
CREATE POLICY "Public read pages" ON pages FOR SELECT USING (true);

-- Newsletter insert only (anon)
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
