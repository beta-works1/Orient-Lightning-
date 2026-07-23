import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BlogPost, Collection, Product, StaticPage } from "./types";

type ProductRow = {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: string | number;
  compare_at_price: string | number | null;
  sku: string;
  product_type: string | null;
  vendor: string | null;
  status: "draft" | "published";
  images: string[] | null;
  variants: Product["variants"] | null;
  options: Product["options"] | null;
  tags: string[] | null;
  facets: { wattage: string[]; colorTemp: string[] } | null;
  seo_title: string;
  seo_description: string;
  published_at: string | null;
};

function publicClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Server-only — bypasses RLS for admin catalog reads (drafts). */
function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

function mapProduct(row: ProductRow, collectionHandles: string[]): Product & { status: "draft" | "published" } {
  return {
    id: row.id,
    handle: row.handle,
    title: row.title,
    description: row.description ?? "",
    price: num(row.price),
    compareAtPrice: row.compare_at_price == null ? null : num(row.compare_at_price),
    sku: row.sku ?? "",
    images: row.images ?? [],
    collectionIds: collectionHandles,
    variants: row.variants ?? [],
    options: row.options ?? [],
    tags: row.tags ?? [],
    productType: row.product_type || undefined,
    vendor: row.vendor || undefined,
    seoTitle: row.seo_title ?? row.title,
    seoDescription: row.seo_description ?? "",
    facets: row.facets ?? { wattage: [], colorTemp: [] },
    publishedAt: row.published_at,
    status: row.status,
  };
}

async function handlesByProductId(
  sb: SupabaseClient,
  productIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!productIds.length) return map;

  const { data, error } = await sb
    .from("product_collections")
    .select("product_id, collections(handle)")
    .in("product_id", productIds);

  if (error) throw new Error(`catalog joins: ${error.message}`);

  for (const row of data || []) {
    const handle = (row as { collections?: { handle?: string } | null }).collections?.handle;
    if (!handle) continue;
    const list = map.get(row.product_id) ?? [];
    list.push(handle);
    map.set(row.product_id, list);
  }
  return map;
}

export async function getAllProducts(opts?: {
  includeDrafts?: boolean;
}): Promise<(Product & { status: "draft" | "published" })[]> {
  const sb = opts?.includeDrafts ? serviceClient() : publicClient();
  let query = sb.from("products").select("*");
  if (!opts?.includeDrafts) query = query.eq("status", "published");

  const { data, error } = await query;
  if (error) throw new Error(`getAllProducts: ${error.message}`);

  const rows = (data || []) as ProductRow[];
  const handles = await handlesByProductId(
    sb,
    rows.map((r) => r.id),
  );
  return rows.map((row) => mapProduct(row, handles.get(row.id) ?? []));
}

export async function getProductByHandle(
  handle: string,
  opts?: { includeDrafts?: boolean },
): Promise<(Product & { status: "draft" | "published" }) | undefined> {
  const sb = opts?.includeDrafts ? serviceClient() : publicClient();
  let query = sb.from("products").select("*").eq("handle", handle);
  if (!opts?.includeDrafts) query = query.eq("status", "published");

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`getProductByHandle: ${error.message}`);
  if (!data) return undefined;

  const row = data as ProductRow;
  const handles = await handlesByProductId(sb, [row.id]);
  return mapProduct(row, handles.get(row.id) ?? []);
}

export async function getProductById(
  id: string,
): Promise<(Product & { status: "draft" | "published" }) | undefined> {
  const sb = serviceClient();
  const { data, error } = await sb.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`getProductById: ${error.message}`);
  if (!data) return undefined;
  const row = data as ProductRow;
  const handles = await handlesByProductId(sb, [row.id]);
  return mapProduct(row, handles.get(row.id) ?? []);
}

export async function getAllCollections(): Promise<Collection[]> {
  const sb = publicClient();
  const { data: cols, error } = await sb.from("collections").select("*");
  if (error) throw new Error(`getAllCollections: ${error.message}`);

  const { data: links, error: linkErr } = await sb
    .from("product_collections")
    .select("collection_id, products!inner(handle, status)");
  if (linkErr) throw new Error(`getAllCollections joins: ${linkErr.message}`);

  const byCol = new Map<string, string[]>();
  for (const row of links || []) {
    const product = (row as { products?: { handle?: string; status?: string } }).products;
    if (!product?.handle || product.status !== "published") continue;
    const list = byCol.get(row.collection_id) ?? [];
    list.push(product.handle);
    byCol.set(row.collection_id, list);
  }

  return (cols || []).map((c) => ({
    id: c.id,
    handle: c.handle,
    title: c.title,
    description: c.description ?? "",
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
  const all = await getAllProducts();
  return all.filter((p) => {
    const hay = [p.title, p.description, p.sku, ...(p.tags || [])].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const sb = publicClient();
  const { data, error } = await sb.from("blog_posts").select("*");
  if (error) throw new Error(`getBlogPosts: ${error.message}`);
  return (data || []).map((r) => ({
    id: r.id,
    handle: r.handle,
    title: r.title,
    excerpt: r.excerpt ?? "",
    body: r.body ?? "",
    publishedAt: r.published_at,
    image: r.image,
  }));
}

export async function getBlogPost(handle: string): Promise<BlogPost | undefined> {
  const sb = publicClient();
  const { data, error } = await sb.from("blog_posts").select("*").eq("handle", handle).maybeSingle();
  if (error) throw new Error(`getBlogPost: ${error.message}`);
  if (!data) return undefined;
  return {
    id: data.id,
    handle: data.handle,
    title: data.title,
    excerpt: data.excerpt ?? "",
    body: data.body ?? "",
    publishedAt: data.published_at,
    image: data.image,
  };
}

export async function getPage(handle: string): Promise<StaticPage | undefined> {
  const sb = publicClient();
  const { data, error } = await sb.from("pages").select("*").eq("handle", handle).maybeSingle();
  if (error) throw new Error(`getPage: ${error.message}`);
  if (!data) return undefined;
  return { id: data.id, handle: data.handle, title: data.title, body: data.body ?? "" };
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
