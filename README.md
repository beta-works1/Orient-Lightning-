# Orient Lighting — Next.js Rebuild

Powered by Beta Works.

Pixel-faithful replacement of [orientlighting.com.pk](https://orientlighting.com.pk) (Shopify → Next.js).

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Drizzle ORM schema for Supabase Postgres
- Local JSON catalog fallback (`data/seeded.json`) so the site runs without a database
- WhatsApp inquiry CTAs instead of checkout (`wa.me/923001674368`)

## Quick start

```bash
npm install
cp .env.example .env.local
npm run seed          # rebuild data/seeded.json from data/shopify/*
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data

Scraped Shopify public JSON lives in `data/shopify/`. The public storefront API only exposed **31 products** (collections report higher counts for unpublished/unavailable items). Replace with a full Shopify Admin export when available, then run `npm run seed`.

## Supabase (required for production)

**Do not reuse an unrelated Supabase project.** Create a dedicated Orient Lighting project, then:

1. Copy credentials into `.env.local`
2. Run `drizzle/0000_init.sql` in the SQL editor
3. Import rows from `data/seeded.json` (or extend `scripts/seed.ts --db`)
4. Create a Storage bucket for product images and rehost off Shopify CDN

## Routes preserved for SEO

`/`, `/collections/[handle]`, `/collections/downlights/[6500k]`, `/products/[handle]`, `/blogs/orient-lighting`, `/pages/*`, `/search`, `/sitemap.xml`, `/robots.txt`

## Deploy (Vercel)

1. Connect GitHub repo `beta-works1/Orient-Lightning-`
2. Set env vars from `.env.example`
3. Deploy staging first
4. Point `orientlighting.com.pk` only after staging verification (A → `76.76.21.21`, `www` CNAME → `cname.vercel-dns.com`)

## Design tokens

Extracted from the live site — see `data/design-tokens.md` (primary `#0f428f`, Montserrat / Oswald / Roboto).
