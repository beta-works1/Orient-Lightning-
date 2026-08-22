import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { usableProductImageUrls } from "./productImages";
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
  catalogue_url?: string | null;
  catalogue_filename?: string | null;
  catalogue_storage_path?: string | null;
};

const PRODUCT_SELECT =
  "id, handle, title, description, price, compare_at_price, sku, product_type, vendor, status, images, variants, options, tags, facets, seo_title, seo_description, published_at, catalogue_url, catalogue_filename, catalogue_storage_path";

const LIST_SELECT =
  "id, handle, title, description, price, compare_at_price, sku, product_type, vendor, status, images, tags, facets, seo_title, seo_description, published_at, catalogue_url, catalogue_filename";

const CATALOG_REVALIDATE = 120;

let _public: SupabaseClient | null = null;
let _service: SupabaseClient | null = null;

function publicClient(): SupabaseClient {
  if (_public) return _public;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  _public = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _public;
}

/** Server-only — bypasses RLS for admin catalog reads (drafts). */
function serviceClient(): SupabaseClient {
  if (_service) return _service;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  _service = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _service;
}

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

function mapProduct(
  row: ProductRow,
  collectionHandles: string[],
): Product & { status: "draft" | "published" } {
  return {
    id: row.id,
    handle: row.handle,
    title: row.title,
    description: row.description ?? "",
    price: num(row.price),
    compareAtPrice: row.compare_at_price == null ? null : num(row.compare_at_price),
    sku: row.sku ?? "",
    images: usableProductImageUrls(row.images),
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
    catalogueUrl: row.catalogue_url || null,
    catalogueFilename: row.catalogue_filename || null,
    catalogueStoragePath: row.catalogue_storage_path || null,
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

async function fetchPublishedProducts(): Promise<(Product & { status: "draft" | "published" })[]> {
  const sb = publicClient();
  const { data, error } = await sb
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "published");
  if (error) throw new Error(`getAllProducts: ${error.message}`);

  const rows = (data || []) as ProductRow[];
  const handles = await handlesByProductId(
    sb,
    rows.map((r) => r.id),
  );
  return rows.map((row) => mapProduct(row, handles.get(row.id) ?? []));
}

const cachedPublishedProducts = unstable_cache(fetchPublishedProducts, ["catalog-products-v4"], {
  revalidate: CATALOG_REVALIDATE,
  tags: ["catalog"],
});

async function fetchAllCollections(): Promise<Collection[]> {
  const sb = publicClient();
  const [{ data: cols, error }, { data: links, error: linkErr }] = await Promise.all([
    sb.from("collections").select("id, handle, title, description, image"),
    sb.from("product_collections").select("collection_id, products!inner(handle, status)"),
  ]);
  if (error) throw new Error(`getAllCollections: ${error.message}`);
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

const cachedCollections = unstable_cache(fetchAllCollections, ["catalog-collections-v2"], {
  revalidate: CATALOG_REVALIDATE,
  tags: ["catalog"],
});

/** Request-deduped published catalog (also cross-request cached). */
export const getAllProducts = cache(async (opts?: { includeDrafts?: boolean }) => {
  if (opts?.includeDrafts) {
    try {
      const sb = serviceClient();
      const { data, error } = await sb.from("products").select(PRODUCT_SELECT);
      if (error) throw new Error(`getAllProducts: ${error.message}`);
      const rows = (data || []) as ProductRow[];
      const handles = await handlesByProductId(
        sb,
        rows.map((r) => r.id),
      );
      return rows.map((row) => mapProduct(row, handles.get(row.id) ?? []));
    } catch (err) {
      // Missing service role / transient DB errors must not 500 the admin shell
      console.error("[getAllProducts includeDrafts]", err);
      return cachedPublishedProducts();
    }
  }
  return cachedPublishedProducts();
});

export const getPublishedProductCount = cache(async (): Promise<number> => {
  const sb = publicClient();
  const { count, error } = await sb
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  if (error) throw new Error(`getPublishedProductCount: ${error.message}`);
  return count ?? 0;
});

export const getProductByHandle = cache(
  async (
    handle: string,
    opts?: { includeDrafts?: boolean },
  ): Promise<(Product & { status: "draft" | "published" }) | undefined> => {
    const sb = opts?.includeDrafts ? serviceClient() : publicClient();
    let query = sb.from("products").select(PRODUCT_SELECT).eq("handle", handle);
    if (!opts?.includeDrafts) query = query.eq("status", "published");

    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(`getProductByHandle: ${error.message}`);
    if (!data) return undefined;

    const row = data as ProductRow;
    const handles = await handlesByProductId(sb, [row.id]);
    return mapProduct(row, handles.get(row.id) ?? []);
  },
);

export async function getProductById(
  id: string,
): Promise<(Product & { status: "draft" | "published" }) | undefined> {
  const sb = serviceClient();
  const { data, error } = await sb
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getProductById: ${error.message}`);
  if (!data) return undefined;
  const row = data as ProductRow;
  const handles = await handlesByProductId(sb, [row.id]);
  return mapProduct(row, handles.get(row.id) ?? []);
}

export const getAllCollections = cache(async () => cachedCollections());

export const getCollectionByHandle = cache(
  async (handle: string): Promise<Collection | undefined> => {
    const sb = publicClient();
    const { data: col, error } = await sb
      .from("collections")
      .select("id, handle, title, description, image")
      .eq("handle", handle)
      .maybeSingle();
    if (error) throw new Error(`getCollectionByHandle: ${error.message}`);
    if (!col) return undefined;

    const { data: links, error: linkErr } = await sb
      .from("product_collections")
      .select("products!inner(handle, status)")
      .eq("collection_id", col.id);
    if (linkErr) throw new Error(`getCollectionByHandle joins: ${linkErr.message}`);

    const productHandles: string[] = [];
    for (const row of links || []) {
      const product = (row as { products?: { handle?: string; status?: string } }).products;
      if (product?.handle && product.status === "published") {
        productHandles.push(product.handle);
      }
    }

    return {
      id: col.id,
      handle: col.handle,
      title: col.title,
      description: col.description ?? "",
      image: col.image,
      productHandles,
    };
  },
);

export const getProductsForCollection = cache(async (handle: string): Promise<Product[]> => {
  const sb = publicClient();
  const { data: col, error: colErr } = await sb
    .from("collections")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();
  if (colErr) throw new Error(`getProductsForCollection: ${colErr.message}`);
  if (!col) return [];

  const { data: links, error } = await sb
    .from("product_collections")
    .select(`products!inner(${LIST_SELECT})`)
    .eq("collection_id", col.id)
    .eq("products.status", "published");
  if (error) throw new Error(`getProductsForCollection products: ${error.message}`);

  const rows: ProductRow[] = [];
  for (const row of links || []) {
    const raw = (row as unknown as { products?: ProductRow | ProductRow[] | null }).products;
    const product = Array.isArray(raw) ? raw[0] : raw;
    if (product) rows.push(product);
  }

  const handles = await handlesByProductId(
    sb,
    rows.map((r) => r.id),
  );
  return rows.map((row) => mapProduct(row, handles.get(row.id) ?? []));
});

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const { getFeaturedSetting } = await import("@/lib/featuredSettings");
  const setting = await getFeaturedSetting();

  if (setting.handles.length) {
    const all = await getAllProducts();
    const byHandle = new Map(all.map((p) => [p.handle, p]));
    const picked = setting.handles
      .map((h) => byHandle.get(h))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .slice(0, limit);
    if (picked.length) return picked;
  }

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
  if (!product.collectionIds.length) {
    return (await getAllProducts())
      .filter((p) => p.handle !== product.handle)
      .slice(0, limit);
  }

  const pools = await Promise.all(
    product.collectionIds.slice(0, 3).map((h) => getProductsForCollection(h)),
  );
  const seen = new Set<string>([product.handle]);
  const related: Product[] = [];
  for (const list of pools) {
    for (const p of list) {
      if (seen.has(p.handle)) continue;
      seen.add(p.handle);
      related.push(p);
      if (related.length >= limit) return related;
    }
  }
  if (related.length >= limit) return related;

  for (const p of await getAllProducts()) {
    if (seen.has(p.handle)) continue;
    related.push(p);
    if (related.length >= limit) break;
  }
  return related;
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  // Catalog is small — filter the cached list (avoids a cold Supabase round-trip).
  const all = await getAllProducts();
  return all
    .filter((p) => {
      const hay = [p.title, p.description, p.sku, ...(p.tags || [])].join(" ").toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 48);
}

export const getBlogPosts = cache(async (): Promise<BlogPost[]> => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("blog_posts")
    .select("id, handle, title, excerpt, body, published_at, image");
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
});

export const getBlogPost = cache(async (handle: string): Promise<BlogPost | undefined> => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("blog_posts")
    .select("id, handle, title, excerpt, body, published_at, image")
    .eq("handle", handle)
    .maybeSingle();
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
});

export const getPage = cache(async (handle: string): Promise<StaticPage | undefined> => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("pages")
    .select("id, handle, title, body")
    .eq("handle", handle)
    .maybeSingle();
  if (error) throw new Error(`getPage: ${error.message}`);
  if (!data) return undefined;
  return { id: data.id, handle: data.handle, title: data.title, body: data.body ?? "" };
});

export function filterProducts(
  listIn: Product[],
  opts: {
    wattage?: string;
    colorTemp?: string;
    lightTone?: string;
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
  if (opts.lightTone) {
    const tone = opts.lightTone.toLowerCase();
    list = list.filter((p) => {
      const temps = p.facets?.colorTemp || [];
      if (!temps.length) {
        // Fall back: search tags/title for warm/natural/day
        const hay = `${p.title} ${(p.tags || []).join(" ")}`.toLowerCase();
        if (tone === "warm") return /warm/.test(hay);
        if (tone === "natural") return /natural/.test(hay);
        if (tone === "daylight") return /day\s*light|daylight|cool/.test(hay);
        return true;
      }
      return temps.some((t) => {
        const k = Number(String(t).replace(/k$/i, ""));
        if (!Number.isFinite(k)) return false;
        if (tone === "warm") return k < 3500;
        if (tone === "natural") return k >= 3500 && k < 5000;
        if (tone === "daylight") return k >= 5000;
        return true;
      });
    });
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
