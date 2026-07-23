/**
 * Two-loop admin catalog CRUD verification against live Supabase.
 * Uses service role (same write path as admin actions) + anon published reads.
 *
 * Run: npx tsx scripts/test-admin-crud-loops.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !service || !anon) {
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const publicClient = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function runLoop(loop: number) {
  const stamp = Date.now();
  const id = `test_loop${loop}_${stamp}`;
  const handle = `test-dummy-loop-${loop}-${stamp}`;
  const title = `Dummy Loop ${loop} ${stamp}`;
  const price = 111 + loop;
  const updatedPrice = price + 50;
  const updatedTitle = `${title} UPDATED`;

  console.log(`\n=== LOOP ${loop} CREATE ===`);
  const { error: createErr } = await admin.from("products").insert({
    id,
    handle,
    title,
    description: `<p>Dummy product for loop ${loop}</p>`,
    price,
    compare_at_price: price + 100,
    sku: `SKU-L${loop}-${stamp}`,
    product_type: "Test Fixture",
    vendor: "Orient",
    status: "draft",
    images: ["https://orientlighting.com.pk/cdn/shop/files/orient-logo.png"],
    variants: [
      {
        id: `${id}_v0`,
        title: "Default",
        price,
        compareAtPrice: price + 100,
        sku: `SKU-L${loop}-${stamp}`,
        available: true,
      },
    ],
    options: [{ name: "Options", values: ["Default"] }],
    tags: ["test-dummy"],
    facets: { wattage: ["12"], colorTemp: ["6500"] },
    seo_title: title,
    seo_description: "dummy",
    published_at: null,
    updated_at: new Date().toISOString(),
  });
  assert(!createErr, `create failed: ${createErr?.message}`);

  const { data: afterCreate, error: read1 } = await admin
    .from("products")
    .select("id, handle, title, price, status, facets")
    .eq("id", id)
    .maybeSingle();
  assert(!read1 && afterCreate, `read after create failed: ${read1?.message}`);
  assert(afterCreate.title === title, "title mismatch after create");
  assert(Number(afterCreate.price) === price, "price mismatch after create");
  assert(afterCreate.status === "draft", "expected draft");
  console.log("✓ create persisted", { id, handle, price });

  // Draft must NOT appear on anon published query
  const { data: publicDraft } = await publicClient
    .from("products")
    .select("id")
    .eq("handle", handle)
    .eq("status", "published")
    .maybeSingle();
  assert(!publicDraft, "draft should not be publicly queryable as published");
  console.log("✓ draft hidden from published reads");

  // Attach to a collection if one exists
  const { data: col } = await admin.from("collections").select("id, handle").limit(1).maybeSingle();
  if (col) {
    const { error: joinErr } = await admin.from("product_collections").insert({
      product_id: id,
      collection_id: col.id,
    });
    assert(!joinErr, `join failed: ${joinErr?.message}`);
    console.log("✓ linked to collection", col.handle);
  }

  console.log(`=== LOOP ${loop} UPDATE ===`);
  const { error: updateErr } = await admin
    .from("products")
    .update({
      title: updatedTitle,
      price: updatedPrice,
      status: "published",
      published_at: new Date().toISOString(),
      variants: [
        {
          id: `${id}_v0`,
          title: "Default",
          price: updatedPrice,
          compareAtPrice: updatedPrice + 100,
          sku: `SKU-L${loop}-${stamp}`,
          available: true,
        },
      ],
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  assert(!updateErr, `update failed: ${updateErr?.message}`);

  const { data: afterUpdate, error: read2 } = await admin
    .from("products")
    .select("title, price, status, variants")
    .eq("id", id)
    .maybeSingle();
  assert(!read2 && afterUpdate, `read after update failed: ${read2?.message}`);
  assert(afterUpdate.title === updatedTitle, "title not updated");
  assert(Number(afterUpdate.price) === updatedPrice, "price not updated");
  assert(afterUpdate.status === "published", "status not published");
  const variantPrice = Array.isArray(afterUpdate.variants)
    ? Number((afterUpdate.variants as { price?: number }[])[0]?.price)
    : NaN;
  assert(variantPrice === updatedPrice, "variant price not synced");
  console.log("✓ update persisted", { title: updatedTitle, price: updatedPrice });

  const { data: publicPub } = await publicClient
    .from("products")
    .select("id, title, price")
    .eq("handle", handle)
    .eq("status", "published")
    .maybeSingle();
  assert(publicPub, "published product not visible to anon");
  assert(publicPub.title === updatedTitle, "anon title mismatch");
  assert(Number(publicPub.price) === updatedPrice, "anon price mismatch");
  console.log("✓ published visible to storefront anon client");

  console.log(`=== LOOP ${loop} DELETE ===`);
  const { error: delErr } = await admin.from("products").delete().eq("id", id);
  assert(!delErr, `delete failed: ${delErr?.message}`);

  const { data: afterDelete } = await admin.from("products").select("id").eq("id", id).maybeSingle();
  assert(!afterDelete, "row still exists after delete");
  const { data: publicGone } = await publicClient
    .from("products")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();
  assert(!publicGone, "deleted product still visible publicly");
  console.log("✓ delete cleaned up");
}

async function main() {
  console.log("Admin CRUD verification — 2 loops");
  await runLoop(1);
  await runLoop(2);
  console.log("\nALL CHECKS PASSED (2/2 loops)");
}

main().catch((e) => {
  console.error("\nFAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
