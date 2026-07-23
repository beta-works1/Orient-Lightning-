/**
 * Finish product↔collection joins after products/collections are loaded.
 *   npx tsx scripts/migrate-seeded-joins.ts
 */
import { readFileSync } from "fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

async function main() {
  const catalog = JSON.parse(readFileSync("data/seeded.json", "utf8")) as {
    products: { handle: string; collectionIds: string[] }[];
    collections: { handle: string; productHandles: string[] }[];
  };

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: cols, error: cErr } = await sb.from("collections").select("id,handle");
  if (cErr) throw new Error(cErr.message);
  const { data: prods, error: pErr } = await sb.from("products").select("id,handle");
  if (pErr) throw new Error(pErr.message);

  console.log("DB collections", cols?.length, "products", prods?.length);

  const handleToId = new Map((cols || []).map((c) => [c.handle, c.id]));
  const prodByHandle = new Map((prods || []).map((p) => [p.handle, p.id]));

  await sb.from("product_collections").delete().neq("product_id", "__none__");

  const joins: { product_id: string; collection_id: string }[] = [];
  const seen = new Set<string>();

  for (const p of catalog.products) {
    const pid = prodByHandle.get(p.handle);
    if (!pid) {
      console.warn("missing product", p.handle);
      continue;
    }
    const ids = new Set<string>();
    for (const h of p.collectionIds || []) {
      const cid = handleToId.get(h);
      if (cid) ids.add(cid);
      else console.warn("unknown collection handle", h);
    }
    for (const c of catalog.collections) {
      if (c.productHandles?.includes(p.handle)) {
        const cid = handleToId.get(c.handle);
        if (cid) ids.add(cid);
      }
    }
    for (const collection_id of ids) {
      const k = `${pid}:${collection_id}`;
      if (seen.has(k)) continue;
      seen.add(k);
      joins.push({ product_id: pid, collection_id });
    }
  }

  console.log("joins", joins.length);
  for (let i = 0; i < joins.length; i += 40) {
    const chunk = joins.slice(i, i + 40);
    const { error } = await sb.from("product_collections").insert(chunk);
    if (error) {
      console.error(chunk[0], error);
      throw new Error(error.message);
    }
  }

  const { count } = await sb
    .from("product_collections")
    .select("*", { count: "exact", head: true });
  console.log("Done joins", count);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
