import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  blogPosts,
  collections,
  pages,
  productCollections,
  products,
} from "@/db/schema";
import type { BlogPost, Collection, Product, StaticPage } from "./types";

function requireDb() {
  const db = getDb();
  if (!db) {
    throw new Error(
      "DATABASE_URL is not set — catalog requires Supabase Postgres. Check .env.local.",
    );
  }
  return db;
}

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

function mapProduct(
  row: typeof products.$inferSelect,
  collectionHandles: string[],
): Product & { status: "draft" | "published" } {
  return {
    id: row.id,
    handle: row.handle,
    title: row.title,
    description: row.description,
    price: num(row.price),
    compareAtPrice: row.compareAtPrice == null ? null : num(row.compareAtPrice),
    sku: row.sku,
    images: row.images ?? [],
    collectionIds: collectionHandles,
    variants: (row.variants as Product["variants"]) ?? [],
    options: (row.options as Product["options"]) ?? [],
    tags: row.tags ?? [],
    productType: row.productType || undefined,
    vendor: row.vendor || undefined,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    facets: row.facets ?? { wattage: [], colorTemp: [] },
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    status: row.status,
  };
}

async function handlesByProductId(
  productIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!productIds.length) return map;
  const db = requireDb();
  const rows = await db
    .select({
      productId: productCollections.productId,
      handle: collections.handle,
    })
    .from(productCollections)
    .innerJoin(collections, eq(productCollections.collectionId, collections.id))
    .where(inArray(productCollections.productId, productIds));

  for (const r of rows) {
    const list = map.get(r.productId) ?? [];
    list.push(r.handle);
    map.set(r.productId, list);
  }
  return map;
}

export async function getAllProducts(opts?: {
  includeDrafts?: boolean;
}): Promise<Product[]> {
  const db = requireDb();
  const rows = opts?.includeDrafts
    ? await db.select().from(products)
    : await db.select().from(products).where(eq(products.status, "published"));

  const handles = await handlesByProductId(rows.map((r) => r.id));
  return rows.map((row) => mapProduct(row, handles.get(row.id) ?? []));
}

export async function getProductByHandle(
  handle: string,
  opts?: { includeDrafts?: boolean },
): Promise<Product | undefined> {
  const db = requireDb();
  const conditions = opts?.includeDrafts
    ? eq(products.handle, handle)
    : and(eq(products.handle, handle), eq(products.status, "published"));

  const [row] = await db.select().from(products).where(conditions).limit(1);
  if (!row) return undefined;
  const handles = await handlesByProductId([row.id]);
  return mapProduct(row, handles.get(row.id) ?? []);
}

export async function getProductById(
  id: string,
): Promise<(Product & { status?: string }) | undefined> {
  const db = requireDb();
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!row) return undefined;
  const handles = await handlesByProductId([row.id]);
  return { ...mapProduct(row, handles.get(row.id) ?? []), status: row.status };
}

export async function getAllCollections(): Promise<Collection[]> {
  const db = requireDb();
  const cols = await db.select().from(collections);
  const links = await db
    .select({
      collectionId: productCollections.collectionId,
      handle: products.handle,
    })
    .from(productCollections)
    .innerJoin(products, eq(productCollections.productId, products.id))
    .where(eq(products.status, "published"));

  const byCol = new Map<string, string[]>();
  for (const l of links) {
    const list = byCol.get(l.collectionId) ?? [];
    list.push(l.handle);
    byCol.set(l.collectionId, list);
  }

  return cols.map((c) => ({
    id: c.id,
    handle: c.handle,
    title: c.title,
    description: c.description,
    image: c.image,
    productHandles: byCol.get(c.id) ?? [],
  }));
}

export async function getCollectionByHandle(
  handle: string,
): Promise<Collection | undefined> {
  const all = await getAllCollections();
  return all.find((c) => c.handle === handle);
}

export async function getProductsForCollection(handle: string): Promise<Product[]> {
  const collection = await getCollectionByHandle(handle);
  if (!collection) return [];
  const set = new Set(collection.productHandles);
  const all = await getAllProducts();
  return all.filter((p) => set.has(p.handle) || p.collectionIds.includes(handle));
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const best = await getProductsForCollection("best-sellers");
  if (best.length) return best.slice(0, limit);
  return (await getAllProducts()).slice(0, limit);
}

export async function getDailyDealProducts(limit = 6): Promise<Product[]> {
  const deals = await getProductsForCollection("daily-deals");
  if (deals.length) return deals.slice(0, limit);
  return (await getAllProducts())
    .filter((p) => p.compareAtPrice && p.compareAtPrice > p.price)
    .slice(0, limit);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const all = await getAllProducts();
  const related = all.filter(
    (p) =>
      p.handle !== product.handle &&
      p.collectionIds.some((id) => product.collectionIds.includes(id)),
  );
  return (related.length ? related : all.filter((p) => p.handle !== product.handle)).slice(
    0,
    limit,
  );
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const db = requireDb();
  const pattern = `%${q}%`;
  const rows = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, "published"),
        or(
          ilike(products.title, pattern),
          ilike(products.description, pattern),
          ilike(products.sku, pattern),
          sql`exists (
            select 1 from jsonb_array_elements_text(coalesce(${products.tags}, '[]'::jsonb)) t
            where t ilike ${pattern}
          )`,
        ),
      ),
    );
  const handles = await handlesByProductId(rows.map((r) => r.id));
  return rows.map((row) => mapProduct(row, handles.get(row.id) ?? []));
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const db = requireDb();
  const rows = await db.select().from(blogPosts);
  return rows.map((r) => ({
    id: r.id,
    handle: r.handle,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    image: r.image,
  }));
}

export async function getBlogPost(handle: string): Promise<BlogPost | undefined> {
  const db = requireDb();
  const [r] = await db.select().from(blogPosts).where(eq(blogPosts.handle, handle)).limit(1);
  if (!r) return undefined;
  return {
    id: r.id,
    handle: r.handle,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    image: r.image,
  };
}

export async function getPage(handle: string): Promise<StaticPage | undefined> {
  const db = requireDb();
  const [r] = await db.select().from(pages).where(eq(pages.handle, handle)).limit(1);
  if (!r) return undefined;
  return { id: r.id, handle: r.handle, title: r.title, body: r.body };
}

export function filterProducts(
  listIn: Product[],
  opts: {
    wattage?: string;
    colorTemp?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  },
): Product[] {
  let list = [...listIn];

  if (opts.wattage) {
    list = list.filter((p) => p.facets?.wattage?.includes(opts.wattage!));
  }
  if (opts.colorTemp) {
    const ct = opts.colorTemp.replace(/k$/i, "");
    list = list.filter(
      (p) =>
        p.facets?.colorTemp?.some((k) => k.replace(/k$/i, "") === ct) ||
        p.handle.includes(ct) ||
        p.title.toLowerCase().includes(`${ct}k`),
    );
  }
  if (opts.minPrice != null) list = list.filter((p) => p.price >= opts.minPrice!);
  if (opts.maxPrice != null) list = list.filter((p) => p.price <= opts.maxPrice!);

  switch (opts.sort) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "title-asc":
      list.sort((a, b) => a.title.localeCompare(b.title));
      break;
    default:
      break;
  }

  return list;
}
