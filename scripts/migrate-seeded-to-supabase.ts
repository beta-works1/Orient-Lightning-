/**
 * One-time import: data/seeded.json → Orient Supabase Postgres.
 * Preserves every product/collection handle exactly.
 *
 *   npx tsx scripts/migrate-seeded-to-supabase.ts
 */
import { readFileSync } from "fs";
import path from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

type SeedProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  images: string[];
  collectionIds: string[];
  variants: unknown[];
  options?: unknown[];
  tags?: string[];
  productType?: string;
  vendor?: string;
  seoTitle: string;
  seoDescription: string;
  facets?: { wattage: string[]; colorTemp: string[] };
  publishedAt?: string | null;
};

type SeedCollection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: string | null;
  productHandles: string[];
};

type SeedBlog = {
  id: string;
  handle: string;
  title: string;
  excerpt: string;
  body: string;
  publishedAt: string | null;
  image: string | null;
};

type SeedPage = {
  id: string;
  handle: string;
  title: string;
  body: string;
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase URL or service role key");

  const catalog = JSON.parse(
    readFileSync(path.join(process.cwd(), "data", "seeded.json"), "utf8"),
  ) as {
    products: SeedProduct[];
    collections: SeedCollection[];
    blogPosts: SeedBlog[];
    pages: SeedPage[];
  };

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(
    `Importing ${catalog.products.length} products, ${catalog.collections.length} collections…`,
  );

  // Assumes tables were truncated (or empty). Upsert row-by-row for pooler stability.
  const handleToId = new Map(catalog.collections.map((c) => [c.handle, c.id]));

  for (const c of catalog.collections) {
    const { error } = await sb.from("collections").upsert({
      id: c.id,
      handle: c.handle,
      title: c.title,
      description: c.description ?? "",
      image: c.image,
    });
    if (error) throw new Error(`collection ${c.handle}: ${error.message}`);
  }
  console.log(`Collections: ${catalog.collections.length}`);

  for (const p of catalog.products) {
    const { error } = await sb.from("products").upsert({
      id: p.id,
      handle: p.handle,
      title: p.title,
      description: p.description ?? "",
      price: p.price,
      compare_at_price: p.compareAtPrice,
      sku: p.sku ?? "",
      product_type: p.productType ?? "",
      vendor: p.vendor ?? "Orient",
      status: "published",
      images: p.images ?? [],
      variants: p.variants ?? [],
      options: p.options ?? [],
      tags: p.tags ?? [],
      facets: p.facets ?? { wattage: [], colorTemp: [] },
      seo_title: p.seoTitle ?? p.title,
      seo_description: p.seoDescription ?? "",
      published_at: p.publishedAt ?? null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`product ${p.handle}: ${error.message}`);
  }
  console.log(`Products: ${catalog.products.length}`);

  const joins: { product_id: string; collection_id: string }[] = [];
  const seen = new Set<string>();
  for (const p of catalog.products) {
    const ids = new Set<string>();
    for (const h of p.collectionIds ?? []) {
      const cid = handleToId.get(h);
      if (cid) ids.add(cid);
    }
    for (const c of catalog.collections) {
      if (c.productHandles?.includes(p.handle)) ids.add(c.id);
    }
    for (const collection_id of ids) {
      const key = `${p.id}:${collection_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      joins.push({ product_id: p.id, collection_id });
    }
  }

  // Chunk joins to avoid payload limits
  for (let i = 0; i < joins.length; i += 200) {
    const chunk = joins.slice(i, i + 200);
    const { error } = await sb.from("product_collections").insert(chunk);
    if (error) throw new Error(`joins: ${error.message}`);
  }

  if (catalog.blogPosts?.length) {
    const { error } = await sb.from("blog_posts").insert(
      catalog.blogPosts.map((b) => ({
        id: b.id,
        handle: b.handle,
        title: b.title,
        excerpt: b.excerpt ?? "",
        body: b.body ?? "",
        published_at: b.publishedAt,
        image: b.image,
      })),
    );
    if (error) throw new Error(`blogs: ${error.message}`);
  }

  if (catalog.pages?.length) {
    const { error } = await sb.from("pages").insert(
      catalog.pages.map((p) => ({
        id: p.id,
        handle: p.handle,
        title: p.title,
        body: p.body ?? "",
      })),
    );
    if (error) throw new Error(`pages: ${error.message}`);
  }

  const [{ count: products }, { count: collections }, { count: joinCount }] = await Promise.all([
    sb.from("products").select("*", { count: "exact", head: true }),
    sb.from("collections").select("*", { count: "exact", head: true }),
    sb.from("product_collections").select("*", { count: "exact", head: true }),
  ]);

  console.log("Done:", {
    products,
    collections,
    joins: joinCount,
    blogs: catalog.blogPosts?.length ?? 0,
    pages: catalog.pages?.length ?? 0,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
