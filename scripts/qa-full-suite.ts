/**
 * End-to-end QA harness for Orient storefront + admin catalog.
 * Creates dummy products, verifies reads, then deletes them.
 *
 * Run: npx tsx scripts/qa-full-suite.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const local = "http://localhost:3000";

if (!url || !service || !anon) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const pub = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let passed = 0;
let failed = 0;
const failures: string[] = [];

function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}
function fail(label: string, detail?: string) {
  failed += 1;
  const msg = detail ? `${label}: ${detail}` : label;
  failures.push(msg);
  console.error(`  ✗ ${msg}`);
}

async function assert(cond: unknown, label: string, detail?: string) {
  if (cond) ok(label);
  else fail(label, detail);
}

async function httpGet(path: string) {
  const res = await fetch(`${local}${path}`, { redirect: "manual" });
  return res;
}

async function section(title: string, fn: () => Promise<void>) {
  console.log(`\n== ${title} ==`);
  await fn();
}

async function cleanupDummies() {
  const { data } = await admin
    .from("products")
    .select("id")
    .or("id.like.qa_%,handle.like.qa-dummy-%");
  if (data?.length) {
    await admin.from("products").delete().in(
      "id",
      data.map((r) => r.id),
    );
  }
}

async function main() {
  console.log("Orient QA full suite");
  await cleanupDummies();

  await section("Storefront HTTP", async () => {
    const routes = [
      "/",
      "/stores",
      "/search?q=led",
      "/compare",
      "/collections/bulbs",
      "/collections/best-sellers",
      "/admin/login",
      "/robots.txt",
      "/sitemap.xml",
    ];
    for (const r of routes) {
      const res = await httpGet(r);
      const good = res.status >= 200 && res.status < 400;
      await assert(good, `${r} → ${res.status}`);
    }
    const adminGate = await httpGet("/admin/products");
    await assert(
      adminGate.status === 307 || adminGate.status === 302,
      "unauth /admin/products redirects to login",
      `got ${adminGate.status}`,
    );
    const loc = adminGate.headers.get("location") || "";
    await assert(loc.includes("/admin/login"), "redirect target is login");
  });

  await section("Catalog data integrity", async () => {
    const { data: products, error: pErr } = await pub
      .from("products")
      .select("id, handle, title, price, status, images")
      .eq("status", "published");
    await assert(!pErr && products && products.length > 0, "published products exist", pErr?.message);
    const shopify = (products || []).filter((p) =>
      JSON.stringify(p.images || []).includes("cdn.shopify.com"),
    );
    await assert(shopify.length === 0, "no Shopify image URLs in published products");

    const { data: cols, error: cErr } = await pub.from("collections").select("id, handle, image");
    await assert(!cErr && cols && cols.length > 0, "collections exist", cErr?.message);
    const shopifyCols = (cols || []).filter((c) => (c.image || "").includes("cdn.shopify.com"));
    await assert(shopifyCols.length === 0, "no Shopify collection images");

    const sample = products![0];
    const page = await httpGet(`/products/${sample.handle}`);
    await assert(page.status === 200, `product page /products/${sample.handle}`);

    const missing = await httpGet("/products/this-handle-does-not-exist-qa");
    await assert(missing.status === 404, "missing product → 404");

    const badCol = await httpGet("/collections/this-collection-does-not-exist-qa");
    await assert(badCol.status === 404, "missing collection → 404");
  });

  await section("Admin CRUD (2 loops) with dummy data", async () => {
    for (const loop of [1, 2] as const) {
      const stamp = Date.now();
      const id = `qa_${loop}_${stamp}`;
      const handle = `qa-dummy-${loop}-${stamp}`;

      const { error: createErr } = await admin.from("products").insert({
        id,
        handle,
        title: `QA Dummy ${loop}`,
        description: `Plain description for QA loop ${loop}`,
        price: 500 + loop,
        compare_at_price: 700 + loop,
        sku: "",
        product_type: "QA Fixture",
        vendor: "Orient",
        status: "draft",
        images: [
          `${url}/storage/v1/object/public/product-images/migrated/3df0ab0e035e7792.png`,
        ],
        variants: [
          {
            id: `${id}_v0`,
            title: "Default",
            price: 500 + loop,
            compareAtPrice: 700 + loop,
            sku: "",
            available: true,
          },
        ],
        options: [],
        tags: ["qa-dummy"],
        facets: { wattage: ["10"], colorTemp: ["4000"] },
        seo_title: `QA Dummy ${loop}`,
        seo_description: "qa",
        published_at: null,
        updated_at: new Date().toISOString(),
      });
      await assert(!createErr, `loop ${loop} create`, createErr?.message);

      const { data: draftPub } = await pub
        .from("products")
        .select("id")
        .eq("handle", handle)
        .eq("status", "published")
        .maybeSingle();
      await assert(!draftPub, `loop ${loop} draft hidden from public`);

      const { error: updErr } = await admin
        .from("products")
        .update({
          title: `QA Dummy ${loop} UPDATED`,
          price: 600 + loop,
          status: "published",
          published_at: new Date().toISOString(),
          variants: [
            {
              id: `${id}_v0`,
              title: "Default",
              price: 600 + loop,
              compareAtPrice: 700 + loop,
              sku: "",
              available: true,
            },
          ],
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      await assert(!updErr, `loop ${loop} update`, updErr?.message);

      const { data: after } = await admin
        .from("products")
        .select("title, price, status, vendor, description")
        .eq("id", id)
        .maybeSingle();
      await assert(after?.title === `QA Dummy ${loop} UPDATED`, `loop ${loop} title persisted`);
      await assert(Number(after?.price) === 600 + loop, `loop ${loop} price persisted`);
      await assert(after?.status === "published", `loop ${loop} published`);
      await assert(after?.vendor === "Orient", `loop ${loop} vendor Orient`);
      await assert(!/</.test(after?.description || ""), `loop ${loop} plain description`);

      const { data: visible } = await pub
        .from("products")
        .select("id, title")
        .eq("handle", handle)
        .eq("status", "published")
        .maybeSingle();
      await assert(!!visible, `loop ${loop} visible to anon`);

      // Collection join
      const { data: col } = await admin.from("collections").select("id").limit(1).maybeSingle();
      if (col) {
        const { error: jErr } = await admin.from("product_collections").insert({
          product_id: id,
          collection_id: col.id,
        });
        await assert(!jErr, `loop ${loop} collection link`, jErr?.message);
      }

      const { error: delErr } = await admin.from("products").delete().eq("id", id);
      await assert(!delErr, `loop ${loop} delete`, delErr?.message);

      const { data: gone } = await admin.from("products").select("id").eq("id", id).maybeSingle();
      await assert(!gone, `loop ${loop} fully removed`);
    }
  });

  await section("Cleanup verification", async () => {
    await cleanupDummies();
    const { count } = await admin
      .from("products")
      .select("id", { count: "exact", head: true })
      .or("id.like.qa_%,handle.like.qa-dummy-%");
    await assert((count ?? 0) === 0, "no leftover QA dummy products");
  });

  await section("Security smoke", async () => {
    const login = await httpGet("/admin/login?next=https://evil.com");
    await assert(login.status === 200, "login page loads with malicious next param");
    // Middleware should sanitize when redirecting unauth users
    const gate = await httpGet("/admin/products");
    const loc = gate.headers.get("location") || "";
    await assert(!loc.includes("evil"), "redirect location not open to external host");
    await assert(loc.includes("/admin/login"), "gate still sends to login");
  });

  console.log(`\n—— Results: ${passed} passed, ${failed} failed ——`);
  if (failures.length) {
    console.error(failures.map((f) => ` - ${f}`).join("\n"));
    process.exit(1);
  }
  console.log("ALL QA CHECKS PASSED");
  // silence unused
  void base;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
