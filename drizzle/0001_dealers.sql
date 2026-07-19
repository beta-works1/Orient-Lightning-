-- Dealers / store locator (dev seed includes unverified placeholders)
-- Apply after 0000_init.sql. Run: npx tsx scripts/seed-dealers.ts

CREATE TABLE IF NOT EXISTS dealers (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('flagship', 'authorized_dealer')),
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

-- If table already existed from an earlier migration without `verified`:
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read dealers" ON dealers;
CREATE POLICY "Public read dealers" ON dealers FOR SELECT USING (true);
