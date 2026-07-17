import { readFileSync } from "fs";
import path from "path";
import type { BlogPost, Catalog, Collection, Product, StaticPage } from "./types";

let cache: Catalog | null = null;

function loadCatalog(): Catalog {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "seeded.json");
  cache = JSON.parse(readFileSync(file, "utf8")) as Catalog;
  return cache;
}

export function getCatalog(): Catalog {
  return loadCatalog();
}

export function getAllProducts(): Product[] {
  return getCatalog().products;
}

export function getProductByHandle(handle: string): Product | undefined {
  return getAllProducts().find((p) => p.handle === handle);
}

export function getAllCollections(): Collection[] {
  return getCatalog().collections;
}

export function getCollectionByHandle(handle: string): Collection | undefined {
  return getAllCollections().find((c) => c.handle === handle);
}

export function getProductsForCollection(handle: string): Product[] {
  const collection = getCollectionByHandle(handle);
  if (!collection) return [];
  const set = new Set(collection.productHandles);
  return getAllProducts().filter((p) => set.has(p.handle) || p.collectionIds.includes(handle));
}

export function getFeaturedProducts(limit = 8): Product[] {
  const best = getProductsForCollection("best-sellers");
  if (best.length) return best.slice(0, limit);
  return getAllProducts().slice(0, limit);
}

export function getDailyDealProducts(limit = 6): Product[] {
  const deals = getProductsForCollection("daily-deals");
  if (deals.length) return deals.slice(0, limit);
  return getAllProducts()
    .filter((p) => p.compareAtPrice && p.compareAtPrice > p.price)
    .slice(0, limit);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const related = getAllProducts().filter(
    (p) =>
      p.handle !== product.handle &&
      p.collectionIds.some((id) => product.collectionIds.includes(id)),
  );
  return (related.length ? related : getAllProducts().filter((p) => p.handle !== product.handle)).slice(
    0,
    limit,
  );
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getAllProducts().filter((p) => {
    const hay = [p.title, p.description, p.sku, ...(p.tags || [])].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

export function getBlogPosts(): BlogPost[] {
  return getCatalog().blogPosts;
}

export function getBlogPost(handle: string): BlogPost | undefined {
  return getBlogPosts().find((p) => p.handle === handle);
}

export function getPage(handle: string): StaticPage | undefined {
  return getCatalog().pages.find((p) => p.handle === handle);
}

export function filterProducts(
  products: Product[],
  opts: {
    wattage?: string;
    colorTemp?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  },
): Product[] {
  let list = [...products];

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
  if (opts.minPrice != null) {
    list = list.filter((p) => p.price >= opts.minPrice!);
  }
  if (opts.maxPrice != null) {
    list = list.filter((p) => p.price <= opts.maxPrice!);
  }

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
