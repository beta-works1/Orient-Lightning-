/**
 * Admin product CRUD smoke test via service role (simulates requireAdmin writes).
 * Creates TEST_DELETE_ME product, verifies anon can read when published, then deletes.
 *
 * Usage: npx tsx --env-file=.env.local scripts/security-admin-crud-qa.ts
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const HANDLE = `test-delete-me-qa-audit-${Date.now()}`;
const TITLE = "TEST_DELETE_ME — QA Audit Product";

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const publicSb = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("Creating", HANDLE);

  const { data: created, error: createErr } = await admin
    .from("products")
    .insert({
      id: `qa-${crypto.randomUUID()}`,
      handle: HANDLE,
      title: TITLE,
      description: "<p>QA audit product — safe to delete</p><script>alert(1)</script>",
      price: 1234,
      compare_at_price: 1500,
      sku: "QA-TEST",
      product_type: "QA",
      status: "published",
      images: [],
      variants: [],
      options: [],
      tags: ["TEST_DELETE_ME"],
      facets: { wattage: ["10W"], colorTemp: ["3000K"] },
      seo_title: TITLE,
      seo_description: "QA",
      published_at: new Date().toISOString(),
    })
    .select("id, handle, price")
    .single();

  if (createErr || !created) throw new Error(createErr?.message || "create failed");
  console.log("PASS create", created.id);

  const { data: pub, error: pubErr } = await publicSb
    .from("products")
    .select("id, price, title")
    .eq("handle", HANDLE)
    .maybeSingle();
  if (pubErr || !pub) throw new Error(pubErr?.message || "anon cannot read published test product");
  console.log("PASS anon read published", pub.price);

  const { error: updErr } = await admin
    .from("products")
    .update({ price: 9999 })
    .eq("id", created.id);
  if (updErr) throw new Error(updErr.message);

  const { data: after } = await publicSb
    .from("products")
    .select("price")
    .eq("handle", HANDLE)
    .maybeSingle();
  if (Number(after?.price) !== 9999) throw new Error("price update not visible to anon");
  console.log("PASS price update visible");

  // Draft should vanish from anon
  await admin.from("products").update({ status: "draft" }).eq("id", created.id);
  const { data: draftView } = await publicSb
    .from("products")
    .select("id")
    .eq("handle", HANDLE)
    .maybeSingle();
  if (draftView) throw new Error("draft still visible to anon");
  console.log("PASS draft hidden from anon");

  const { error: delErr } = await admin.from("products").delete().eq("id", created.id);
  if (delErr) throw new Error(delErr.message);

  const { data: gone } = await publicSb
    .from("products")
    .select("id")
    .eq("handle", HANDLE)
    .maybeSingle();
  if (gone) throw new Error("product still visible after delete");
  console.log("PASS deleted");

  // Sweep any leftover TEST_DELETE_ME
  const { data: leftovers } = await admin
    .from("products")
    .select("id, handle")
    .ilike("title", "TEST_DELETE_ME%");
  if (leftovers?.length) {
    await admin.from("products").delete().in(
      "id",
      leftovers.map((r) => r.id),
    );
    console.log("cleaned leftovers", leftovers.length);
  }

  // Cleanup newsletter markers
  await admin.from("newsletter_subscribers").delete().like("email", "qa-audit-delete-me-%");

  console.log("ALL CRUD QA PASSED");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
