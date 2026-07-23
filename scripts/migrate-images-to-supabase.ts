/**
 * Download product/collection images from Shopify CDN into Supabase Storage,
 * rewrite DB URLs, and convert product descriptions to plain text.
 *
 * Run: npx tsx scripts/migrate-images-to-supabase.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !service) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKET = "product-images";
const HOST = new URL(url).hostname;

function needsMigrate(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) return false;
  if (imageUrl.includes(HOST) && imageUrl.includes("/storage/v1/object/public/")) return false;
  return true;
}

function extFromUrlOrType(imageUrl: string, contentType: string | null): string {
  const fromType = contentType?.split("/")[1]?.split(";")[0]?.trim();
  if (fromType && /^[a-z0-9]+$/i.test(fromType)) {
    return fromType === "jpeg" ? "jpg" : fromType;
  }
  const path = imageUrl.split("?")[0];
  const m = path.match(/\.([a-z0-9]{2,5})$/i);
  return (m?.[1] || "jpg").toLowerCase();
}

function toPlainText(input: string) {
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const cache = new Map<string, string>();

async function migrateUrl(imageUrl: string): Promise<string> {
  if (!needsMigrate(imageUrl)) return imageUrl;
  if (cache.has(imageUrl)) return cache.get(imageUrl)!;

  const res = await fetch(imageUrl, {
    headers: { "User-Agent": "OrientLightingImageMigrator/1.0" },
  });
  if (!res.ok) {
    throw new Error(`download ${imageUrl} → ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const hash = createHash("sha1").update(buf).digest("hex").slice(0, 16);
  const ext = extFromUrlOrType(imageUrl, res.headers.get("content-type"));
  const path = `migrated/${hash}.${ext}`;

  const { error: upErr } = await sb.storage.from(BUCKET).upload(path, buf, {
    contentType: res.headers.get("content-type") || `image/${ext}`,
    upsert: true,
  });
  if (upErr) throw new Error(`upload ${path}: ${upErr.message}`);

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  cache.set(imageUrl, data.publicUrl);
  return data.publicUrl;
}

async function main() {
  console.log("Migrating product images + plain-text descriptions…");
  const { data: products, error } = await sb.from("products").select("id, handle, images, description");
  if (error) throw new Error(error.message);

  let productUpdates = 0;
  let imageMoves = 0;

  for (const p of products || []) {
    const images = Array.isArray(p.images) ? (p.images as string[]) : [];
    const nextImages: string[] = [];
    let changed = false;

    for (const img of images) {
      if (!img) continue;
      if (!needsMigrate(img)) {
        nextImages.push(img);
        continue;
      }
      try {
        const next = await migrateUrl(img);
        nextImages.push(next);
        imageMoves += 1;
        changed = true;
        console.log(`  ✓ ${p.handle}: ${img.slice(0, 60)}…`);
      } catch (e) {
        console.warn(`  ✗ keep old (${p.handle}):`, e instanceof Error ? e.message : e);
        nextImages.push(img);
      }
    }

    const plain = toPlainText(p.description || "");
    const descChanged = plain !== (p.description || "");

    if (changed || descChanged) {
      const { error: updErr } = await sb
        .from("products")
        .update({
          images: nextImages,
          description: plain,
          seo_description: plain.slice(0, 160),
          updated_at: new Date().toISOString(),
        })
        .eq("id", p.id);
      if (updErr) throw new Error(`product ${p.id}: ${updErr.message}`);
      productUpdates += 1;
    }
  }

  console.log("\nMigrating collection images…");
  const { data: cols, error: colErr } = await sb.from("collections").select("id, handle, image");
  if (colErr) throw new Error(colErr.message);

  let colUpdates = 0;
  for (const c of cols || []) {
    if (!needsMigrate(c.image)) continue;
    try {
      const next = await migrateUrl(c.image);
      const { error: updErr } = await sb.from("collections").update({ image: next }).eq("id", c.id);
      if (updErr) throw new Error(updErr.message);
      colUpdates += 1;
      console.log(`  ✓ collection ${c.handle}`);
    } catch (e) {
      console.warn(`  ✗ collection ${c.handle}:`, e instanceof Error ? e.message : e);
    }
  }

  const { count: shopifyLeft } = await sb
    .from("products")
    .select("id", { count: "exact", head: true })
    .like("images", "%cdn.shopify.com%");

  console.log("\nDone.");
  console.log({ productUpdates, imageMoves, colUpdates, shopifyProductsLeft: shopifyLeft ?? 0 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
