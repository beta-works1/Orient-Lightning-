/**
 * Regenerates data/seeded.json from Shopify public JSON exports in data/shopify/.
 * Optionally upserts into Postgres when DATABASE_URL is set.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *   DATABASE_URL=... npx tsx scripts/seed.ts --db
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import "dotenv/config";

type ShopifyProduct = {
  id: number | string;
  title: string;
  handle: string;
  body_html?: string;
  published_at?: string;
  vendor?: string;
  product_type?: string;
  tags?: string | string[];
  variants: {
    id: number | string;
    title?: string;
    price?: string;
    compare_at_price?: string | null;
    sku?: string;
    available?: boolean;
    option1?: string | null;
    option2?: string | null;
    option3?: string | null;
  }[];
  images: { src?: string }[];
  options?: { name: string; values: string[] }[];
};

type ShopifyCollection = {
  id: number | string;
  handle: string;
  title: string;
  body_html?: string;
  description?: string;
  image?: { src?: string } | string | null;
};

const root = process.cwd();
const shopifyDir = path.join(root, "data", "shopify");

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").trim();
}

function main() {
  const productsFile = existsSync(path.join(shopifyDir, "products-all.json"))
    ? path.join(shopifyDir, "products-all.json")
    : path.join(shopifyDir, "products-page1.json");

  const products = loadJson<{ products: ShopifyProduct[] }>(productsFile).products;
  const collections = loadJson<{ collections: ShopifyCollection[] }>(
    path.join(shopifyDir, "collections.json"),
  ).collections;

  const collProducts: Record<string, string[]> = {};
  for (const c of collections) {
    const f = path.join(shopifyDir, `collection-${c.handle}.json`);
    if (!existsSync(f)) {
      collProducts[c.handle] = [];
      continue;
    }
    const data = loadJson<{ products: { handle: string }[] }>(f);
    collProducts[c.handle] = (data.products || []).map((p) => p.handle);
  }

  const outProducts = products.map((p) => {
    const tags = Array.isArray(p.tags)
      ? p.tags
      : String(p.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
    const images = (p.images || []).map((i) => i.src!).filter(Boolean);
    const variants = (p.variants || []).map((v) => ({
      id: String(v.id),
      title: v.title || "Default",
      price: parseFloat(v.price || "0"),
      compareAtPrice: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
      sku: v.sku || "",
      available: Boolean(v.available ?? true),
      option1: v.option1,
      option2: v.option2,
      option3: v.option3,
    }));
    const minPrice = Math.min(...variants.map((v) => v.price), 0);
    const compare = variants.find((v) => v.compareAtPrice)?.compareAtPrice ?? null;
    const optText = (p.options || [])
      .map((o) => `${o.name} ${(o.values || []).join(" ")}`)
      .join(" ");
    const text = `${p.title} ${tags.join(" ")} ${optText}`;
    const watts = Array.from(new Set([...(text.match(/(\d+)\s*[Ww]\b/g) || [])].map((m) => m.replace(/\D/g, ""))));
    const kelvins = Array.from(
      new Set(
        [...(text.match(/(2700|3000|4000|5000|6500)\s*[Kk]?/gi) || [])].map((m) =>
          m.replace(/\D/g, ""),
        ),
      ),
    );
    const collectionIds = Object.entries(collProducts)
      .filter(([, handles]) => handles.includes(p.handle))
      .map(([h]) => h);

    return {
      id: String(p.id),
      handle: p.handle,
      title: p.title,
      description: p.body_html || "",
      price: Number.isFinite(minPrice) ? minPrice : 0,
      compareAtPrice: compare,
      sku: variants[0]?.sku || "",
      images,
      collectionIds,
      variants,
      options: p.options || [],
      tags,
      productType: p.product_type || "",
      vendor: p.vendor || "",
      seoTitle: p.title,
      seoDescription: stripHtml(p.body_html || "").slice(0, 160),
      facets: { wattage: watts, colorTemp: kelvins },
      publishedAt: p.published_at || null,
    };
  });

  // Fix price when variants empty edge case
  for (const p of outProducts) {
    if (!p.variants.length) p.price = 0;
    else p.price = Math.min(...p.variants.map((v) => v.price));
  }

  const outCollections = collections.map((c) => ({
    id: String(c.id),
    handle: c.handle,
    title: c.title,
    description: c.body_html || c.description || "",
    image:
      typeof c.image === "string"
        ? c.image
        : c.image && typeof c.image === "object"
          ? c.image.src || null
          : null,
    productHandles: collProducts[c.handle] || [],
  }));

  const seed = {
    products: outProducts,
    collections: outCollections,
    blogPosts: [
      {
        id: "1",
        handle: "welcome-to-orient-lighting",
        title: "Welcome to Orient Lighting",
        excerpt:
          "Orient Lighting has been illuminating Pakistan since 1996 with quality LED solutions.",
        body: "<p>Orient Lighting, operated by Photon Electric Pvt Ltd, has served residential, commercial, and industrial customers across Pakistan since 1996.</p>",
        publishedAt: "2024-01-15",
        image: null,
      },
    ],
    pages: [
      {
        id: "1",
        handle: "become-our-partner",
        title: "Become Our Partner",
        body: "<p>Partner with Orient Lighting / Photon Electric Pvt Ltd. Contact sales@orientlighting.pk or WhatsApp +92 300 1674368.</p>",
      },
      {
        id: "2",
        handle: "terms-and-conditions",
        title: "Terms & Conditions",
        body: "<p>Terms and conditions content will be updated from the live Shopify page export.</p>",
      },
      {
        id: "3",
        handle: "privacy-policy",
        title: "Privacy Policy",
        body: "<p>Privacy policy content will be updated from the live Shopify page export.</p>",
      },
      {
        id: "4",
        handle: "return-exchange",
        title: "Return & Exchange",
        body: "<p>Return and exchange policy content will be updated from the live Shopify page export.</p>",
      },
      {
        id: "5",
        handle: "warranty-claim",
        title: "Warranty & Claim",
        body: "<p>Warranty and claim policy content will be updated from the live Shopify page export.</p>",
      },
    ],
    meta: {
      source: "shopify-public-json",
      productCount: outProducts.length,
      collectionCount: outCollections.length,
      whatsapp: "923001674368",
      generatedAt: new Date().toISOString(),
      shopifyFiles: readdirSync(shopifyDir).length,
    },
  };

  const outPath = path.join(root, "data", "seeded.json");
  writeFileSync(outPath, JSON.stringify(seed, null, 2));
  console.log(`Wrote ${outPath} (${outProducts.length} products, ${outCollections.length} collections)`);

  if (process.argv.includes("--db")) {
    console.log(
      "DB upsert not run in this mode yet — apply drizzle/0000_init.sql then import seeded.json via your Supabase SQL editor or extend this script.",
    );
  }
}

main();
