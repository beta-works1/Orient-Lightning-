/**
 * Adversarial QA harness — Agent 4.
 *
 * Three-loop full pass over:
 *   (A) image upload success + failure
 *   (B) partner form success + validation (DB + HTTP + CSP; no live sales@ spam)
 *   (C) admin per-product catalogs (A for product 1, B for product 2)
 *   (D) regression: existing catalogue, auth gate, product CRUD
 *
 * Evidence-only: status codes, stored rows, reachable URLs, source greps.
 * Does NOT email sales@orientlighting.pk.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/qa-adversarial-loops.ts --loop 1
 *   npx tsx --env-file=.env.local scripts/qa-adversarial-loops.ts --loop 2
 *   npx tsx --env-file=.env.local scripts/qa-adversarial-loops.ts --loop 3
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createHash } from "node:crypto";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { detectFileKind } from "../src/lib/fileMagic";
import { createSignedUploadSlot, removeStorageObject } from "../src/lib/upload/storage";

const LOOP = Number(
  (process.argv.includes("--loop")
    ? process.argv[process.argv.indexOf("--loop") + 1]
    : process.env.QA_LOOP) || "1",
);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const local = process.env.QA_BASE_URL || "http://localhost:3000";

const PREFIX = "qa_adv";
const HANDLE_PREFIX = "qa-adv";
const STORAGE_PREFIX = `qa-adversarial/loop-${LOOP}`;

type CaseResult = {
  id: string;
  area: "A" | "B" | "C" | "D" | "SRC";
  pass: boolean;
  detail: string;
  evidence?: Record<string, unknown>;
};

const results: CaseResult[] = [];

function record(
  area: CaseResult["area"],
  id: string,
  pass: boolean,
  detail: string,
  evidence?: Record<string, unknown>,
) {
  results.push({ id, area, pass, detail, evidence });
  const mark = pass ? "PASS" : "FAIL";
  console.log(`  [${mark}] ${id} — ${detail}`);
}

function src(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

function tinyPng(): Buffer {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
}

/** Minimal JFIF used by tests/upload-storage-smoke.ts */
function tinyJpeg(): Buffer {
  return Buffer.from("ffd8ffe000104a46494600010100000100010000ffd9", "hex");
}

const AGENT2_LEFTOVER_EMAILS = [
  "qa.local.partner.aug22@example.com",
  "qa.service.insert.aug22@example.com",
  "qa.partner.aug22@example.com",
];

function tinyPdf(marker: string): Buffer {
  const body = `BT /F1 12 Tf 72 720 Td (${marker}) Tj ET`;
  return Buffer.from(
    `%PDF-1.4\n1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>endobj\n4 0 obj<< /Length ${body.length} >>stream\n${body}\nendstream\nendobj\ntrailer<< /Root 1 0 R >>\n%%EOF\n`,
  );
}

function writeFixtures() {
  const dir = join(process.cwd(), "scripts/qa-fixtures");
  mkdirSync(dir, { recursive: true });
  const files: Record<string, Buffer | string> = {
    "qa-valid-1x1.png": tinyPng(),
    "qa-fake-image.png": Buffer.from("this is not an image, it is a lie"),
    "qa-empty.png": Buffer.alloc(0),
    "qa-catalog-A.pdf": tinyPdf("QA-CATALOG-PRODUCT-1"),
    "qa-catalog-B.pdf": tinyPdf("QA-CATALOG-PRODUCT-2"),
    "README.txt":
      "Adversarial QA fixtures. Unique markers in PDFs: QA-CATALOG-PRODUCT-1 / QA-CATALOG-PRODUCT-2.\n",
  };
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(dir, name), body);
  }
  return dir;
}

async function httpGet(path: string) {
  const res = await fetch(`${local}${path}`, { redirect: "manual" });
  const text = await res.text().catch(() => "");
  return { status: res.status, location: res.headers.get("location") || "", text, headers: res.headers };
}

async function headOrGet(absoluteUrl: string) {
  const res = await fetch(absoluteUrl, { method: "GET", redirect: "follow" });
  const buf = Buffer.from(await res.arrayBuffer());
  return { status: res.status, contentType: res.headers.get("content-type") || "", bytes: buf.length, buf };
}

function inspectSource() {
  console.log("\n== SRC naive-fix greps ==");
  const nextCfg = src("next.config.ts");
  const actions = src("src/app/admin/actions.ts");
  const partner = src("src/app/actions/partner.ts");
  const partnerUi = src("src/components/partner/PartnerApplicationForm.tsx");
  const catalogueLib = src("src/lib/catalogueSettings.ts");
  const catalogueAdmin = src("src/components/admin/CatalogueAdminForm.tsx");
  const cataloguePage = src("src/app/admin/(dashboard)/catalogue/page.tsx");
  const productPage = src("src/app/products/[handle]/page.tsx");
  const schema = src("src/db/schema.ts");
  const hardening = src("drizzle/0005_security_hardening.sql");
  const email = src("src/lib/email.ts");

  record(
    "SRC",
    "src.bodySizeLimit",
    /bodySizeLimit/.test(nextCfg),
    /bodySizeLimit/.test(nextCfg)
      ? "serverActions.bodySizeLimit is set (needed: UI allows 5MB, Next default is 1MB)"
      : "NO serverActions.bodySizeLimit — Next.js default ~1MB vs uploadProductImage 5MB cap",
  );

  const formsubmitInConnect = /formsubmit/.test(nextCfg);
  const clientFormSubmit = /formsubmit\.co/.test(partnerUi);
  record(
    "SRC",
    "src.csp.formsubmit",
    !clientFormSubmit || formsubmitInConnect,
    clientFormSubmit && !formsubmitInConnect
      ? "AGENT2 FAIL: client FormSubmit remains but CSP connect-src lacks formsubmit.co"
      : clientFormSubmit
        ? "Client FormSubmit + CSP hole (localhost-only is not production)"
        : "No client FormSubmit; CSP formsubmit whitelist not required",
  );

  const emailFailStillOk =
    /Server email failed \(browser will retry\)/.test(partner) &&
    /ok: true/.test(partner) &&
    /notifyPayload/.test(partner);
  record(
    "SRC",
    "src.partner.okDespiteEmailFail",
    !emailFailStillOk,
    emailFailStillOk
      ? "BUG: submitPartnerApplication returns ok:true even when sendEmail fails; 'browser will retry' is the claimed fix"
      : "Server action does not report success when email fails",
  );

  record(
    "SRC",
    "src.partner.noAlert",
    !/\balert\s*\(/.test(partnerUi),
    /\balert\s*\(/.test(partnerUi)
      ? "Partner UI still uses alert() — not a real fix"
      : "Partner UI does not use alert() (good); success is a green box",
  );

  record(
    "SRC",
    "src.partner.browserFormSubmit",
    !/formsubmit\.co/.test(partnerUi),
    /formsubmit\.co/.test(partnerUi)
      ? "BUG: Partner client still POSTs to formsubmit.co from the browser (CSP + third-party ≠ a product fix)"
      : "Partner UI does not call FormSubmit from the browser",
  );

  const honeypotFake =
    /company_website/.test(partner) && /ok: true/.test(partner.slice(0, partner.indexOf("rateLimited")));
  record(
    "SRC",
    "src.partner.honeypotFakeOk",
    true,
    honeypotFake
      ? "NOTE (not a fail): honeypot returns ok:true without insert — do not treat that as evidence the form works"
      : "No honeypot fake-success path found",
  );

  const hasProductCatalogueCol =
    /catalogue/i.test(schema) && /products = pgTable/.test(schema);
  // schema mentions partner etc.; look specifically at products table block
  const productsBlock = schema.slice(
    schema.indexOf("export const products"),
    schema.indexOf("export const collections"),
  );
  const productHasCatalogueField = /catalogue/i.test(productsBlock);
  record(
    "SRC",
    "src.products.catalogueColumn",
    productHasCatalogueField,
    productHasCatalogueField
      ? "products table schema includes a catalogue field"
      : "products schema has NO catalogue_url / catalogue_path column — per-product catalogs cannot persist",
  );

  const productForm = src("src/components/admin/ProductForm.tsx");
  const catalogueBrowser = existsSync(join(process.cwd(), "src/lib/catalogueBrowser.ts"))
    ? src("src/lib/catalogueBrowser.ts")
    : "";
  const hasCatalogueUi =
    /name="catalogueUrl"/.test(productForm) &&
    (/uploadProductCatalogueFile/.test(productForm) ||
      /uploadAdminFile/.test(productForm) ||
      /purpose:\s*"catalogue"/.test(productForm) ||
      /purpose:\s*"catalogue"/.test(catalogueBrowser));
  record(
    "SRC",
    "src.productForm.catalogueUpload",
    hasCatalogueUi,
    hasCatalogueUi
      ? "ProductForm has per-product PDF control + hidden catalogueUrl (values persist only on Save)"
      : "BUG: ProductForm has no per-product catalogue upload UI",
  );

  record(
    "SRC",
    "src.productForm.usesSignedUpload",
    /uploadAdminFile/.test(productForm) || /uploadProductCatalogueFile/.test(productForm),
    /uploadAdminFile/.test(productForm) || /uploadProductCatalogueFile/.test(productForm)
      ? "ProductForm uses signed-URL browser upload (uploadAdminFile / uploadProductCatalogueFile)"
      : "BUG: ProductForm still posts File bytes through a server-action body",
  );

  record(
    "SRC",
    "src.agent2.clientFormSubmit",
    !/formsubmit\.co/.test(partnerUi),
    /formsubmit\.co/.test(partnerUi)
      ? "AGENT2 FAIL: PartnerApplicationForm still POSTs to formsubmit.co from the browser"
      : "Partner UI does not call FormSubmit from the browser",
  );

  const successIgnoresEmail =
    /sales team will contact you/.test(partner) &&
    /notifyPayload: emailResult\.ok \? undefined : notifyPayload/.test(partner);
  record(
    "SRC",
    "src.agent2.successCopyIgnoresEmailFail",
    !successIgnoresEmail,
    successIgnoresEmail
      ? "AGENT2 FAIL: same 'sales team will contact you' copy even when sendEmail failed (notifyPayload only for browser retry)"
      : "Success copy distinguishes email failure",
  );

  record(
    "SRC",
    "src.agent2.honeypotFakeSuccess",
    !/if \(honey\)/.test(partner) || !/ok: true/.test(partner),
    /if \(honey\)/.test(partner)
      ? "AGENT2 FAIL: honeypot returns ok:true with the thank-you copy and no insert — green box ≠ delivery"
      : "No honeypot fake-success path",
  );

  const uploadFn = actions.slice(
    actions.indexOf("export async function uploadProductImage"),
    actions.indexOf("export async function uploadProductImage") + 1400,
  );
  const swallows = /Upload failed\. Try again\./.test(uploadFn);
  record(
    "SRC",
    "src.upload.swallowsStorageError",
    !swallows,
    swallows
      ? "BUG: uploadProductImage returns generic 'Upload failed. Try again.' and drops storage error.message"
      : "uploadProductImage surfaces the storage error",
  );

  const droppedPublicRead =
    /DROP POLICY IF EXISTS "Public read product images"/.test(hardening) &&
    /DROP POLICY IF EXISTS "Public read catalogues"/.test(hardening);
  record(
    "SRC",
    "src.hardening.droppedPublicRead",
    !droppedPublicRead,
    droppedPublicRead
      ? "BUG: 0005_security_hardening.sql DROPS public storage SELECT policies and does not recreate them"
      : "Hardening migration no longer drops public storage reads without replacement",
  );

  const alwaysTrue = /function canDeliverPartnerEmail[\s\S]{0,250}return true/.test(email);
  record(
    "SRC",
    "src.email.canDeliverAlwaysTrue",
    !alwaysTrue,
    alwaysTrue
      ? "BUG: canDeliverPartnerEmail() returns true unconditionally — health endpoint cannot fail"
      : "canDeliverPartnerEmail is honest about provider readiness",
  );

  const swallowCatalogue = /catch \{[\s\S]{0,80}DEFAULT_CATALOGUE/.test(catalogueLib);
  record(
    "SRC",
    "src.catalogue.catchAll",
    !swallowCatalogue,
    swallowCatalogue
      ? "BUG: getCatalogueSetting swallows errors and returns the static public PDF default"
      : "Catalogue fetch does not silently fall back without logging",
  );

  record(
    "SRC",
    "src.pdp.perProductHelper",
    /getCatalogueForProduct/.test(productPage),
    /getCatalogueForProduct/.test(productPage)
      ? "PDP calls getCatalogueForProduct (HTML hrefs must still differ in section C)"
      : "BUG: PDP does not call getCatalogueForProduct",
  );

  const hasSignedCatalogue =
    /createSignedUploadSlot/.test(src("src/lib/upload/storage.ts")) &&
    (/purpose:\s*"catalogue"/.test(catalogueBrowser) || /purpose:\s*"catalogue"/.test(productForm));
  record(
    "SRC",
    "src.admin.perProductCatalogueAction",
    hasSignedCatalogue,
    hasSignedCatalogue
      ? "Per-product PDF uses createSignedUploadSlot / uploadAdminFile (row still only updates on Save)"
      : "BUG: no signed-slot catalogue upload path wired to the product form",
  );

  void cataloguePage;
  void hasProductCatalogueCol;
}

async function cleanup(admin: SupabaseClient) {
  await admin.from("products").delete().or(`id.like.${PREFIX}%,handle.like.${HANDLE_PREFIX}%`);
  await admin.from("partner_applications").delete().like("company_name", "QA-ADV-%");
  const { data: objs } = await admin.storage.from("product-images").list("qa-adversarial", {
    limit: 100,
  });
  if (objs?.length) {
    await admin.storage
      .from("product-images")
      .remove(objs.map((o) => `qa-adversarial/${o.name}`));
  }
  // recursive-ish: also remove loop folders
  for (const loop of [1, 2, 3]) {
    const { data: loopFiles } = await admin.storage
      .from("product-images")
      .list(`qa-adversarial/loop-${loop}`, { limit: 100 });
    if (loopFiles?.length) {
      await admin.storage
        .from("product-images")
        .remove(loopFiles.map((o) => `qa-adversarial/loop-${loop}/${o.name}`));
    }
    const { data: catFiles } = await admin.storage
      .from("catalogues")
      .list(`qa-adversarial/loop-${loop}`, { limit: 100 });
    if (catFiles?.length) {
      await admin.storage
        .from("catalogues")
        .remove(catFiles.map((o) => `qa-adversarial/loop-${loop}/${o.name}`));
    }
  }
}

async function sectionA(admin: SupabaseClient, pub: SupabaseClient) {
  console.log("\n== A. Image upload ==");
  const png = tinyPng();
  const fake = Buffer.from("this is not an image, it is a lie");
  const pdf = tinyPdf("NOT-AN-IMAGE");

  record("A", "A.magic.validPng", detectFileKind(png) === "png", `detectFileKind(png)=${detectFileKind(png)}`);
  record("A", "A.magic.fakePng", detectFileKind(fake) === null, `detectFileKind(fake)=${detectFileKind(fake)}`);
  record("A", "A.magic.pdfNotImage", detectFileKind(pdf) === "pdf", `detectFileKind(pdf)=${detectFileKind(pdf)}`);

  const path = `${STORAGE_PREFIX}/valid-${Date.now()}.png`;
  const { error: upErr } = await admin.storage.from("product-images").upload(path, png, {
    contentType: "image/png",
    upsert: false,
  });
  record("A", "A.serviceUpload", !upErr, upErr ? upErr.message : `uploaded ${path}`);

  const { data: pubUrl } = admin.storage.from("product-images").getPublicUrl(path);
  const got = await headOrGet(pubUrl.publicUrl);
  record(
    "A",
    "A.publicGet",
    got.status === 200 && got.bytes > 0 && detectFileKind(got.buf) === "png",
    `GET ${pubUrl.publicUrl} → HTTP ${got.status} bytes=${got.bytes} kind=${detectFileKind(got.buf)} type=${got.contentType}`,
    { status: got.status, url: pubUrl.publicUrl, bytes: got.bytes },
  );

  const { data: listed } = await admin.storage.from("product-images").list(STORAGE_PREFIX, { limit: 20 });
  const found = (listed || []).some((o) => path.endsWith(o.name));
  record("A", "A.objectOnDisk", found, found ? `storage.objects lists ${path}` : `NOT listed under ${STORAGE_PREFIX}`);

  const { error: anonUp } = await pub.storage.from("product-images").upload(`${path}-anon.png`, png, {
    contentType: "image/png",
    upsert: false,
  });
  record(
    "A",
    "A.anonUploadRejected",
    !!anonUp,
    anonUp ? `anon upload correctly rejected: ${anonUp.message}` : "ANON UPLOAD SUCCEEDED — missing storage RLS",
  );

  // Agent 1 claim: createSignedUploadSlot → PUT → unauthenticated GET 200 (not an admin session).
  const jpeg = tinyJpeg();
  record("A", "A.magic.validJpeg", detectFileKind(jpeg) === "jpeg", `detectFileKind(jpeg)=${detectFileKind(jpeg)}`);
  for (const [label, bytes, fileName, kind] of [
    ["png", png, `qa-signed-loop${LOOP}.png`, "png"],
    ["jpeg", jpeg, `qa-signed-loop${LOOP}.jpg`, "jpeg"],
  ] as const) {
    const slot = await createSignedUploadSlot({
      purpose: "product-image",
      fileName,
      size: bytes.length,
      contentType: kind === "png" ? "image/png" : "image/jpeg",
      folder: STORAGE_PREFIX,
    });
    record("A", `A.signedSlot.${label}`, slot.ok, slot.ok ? slot.path : slot.error);
    if (!slot.ok) continue;
    const put = await fetch(slot.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": slot.contentType },
      body: new Uint8Array(bytes),
    });
    record("A", `A.signedPut.${label}`, put.ok, `PUT ${put.status}`);
    const get = await headOrGet(slot.url);
    record(
      "A",
      `A.signedGet.${label}`,
      get.status === 200 && get.bytes > 0,
      `GET ${slot.url} → HTTP ${get.status} bytes=${get.bytes} type=${get.contentType}`,
      { status: get.status, url: slot.url, bytes: get.bytes },
    );
    await removeStorageObject("product-image", slot.path);
  }
  record(
    "A",
    "A.adminUiUnclicked",
    true,
    "NOTE (conditional-go only): no ADMIN password in env — prepareStorageUpload/cookie session was not exercised. Signed-slot PUT+GET is not the admin UI.",
  );

  const { data: existing } = await admin
    .from("products")
    .select("id, handle, images")
    .eq("status", "published")
    .not("images", "eq", "[]")
    .limit(1)
    .maybeSingle();
  if (existing && Array.isArray(existing.images) && existing.images[0]) {
    const img = String(existing.images[0]);
    const live = await headOrGet(img);
    record(
      "A",
      "A.existingProductImage",
      live.status === 200 && live.bytes > 500,
      `existing ${existing.handle} image GET ${live.status} bytes=${live.bytes}`,
      { url: img, status: live.status, bytes: live.bytes },
    );
  } else {
    record("A", "A.existingProductImage", false, "no published product with images to probe");
  }

  const { data: anonList, error: anonListErr } = await pub.storage.from("product-images").list("uploads", { limit: 1 });
  record(
    "A",
    "A.anonCannotListBucket",
    !!anonListErr || (anonList?.length ?? 0) === 0,
    anonListErr
      ? `anon list rejected: ${anonListErr.message}`
      : `anon list returned ${anonList?.length ?? 0} objects (public buckets may list if SELECT policy exists)`,
  );
}

async function sectionB(admin: SupabaseClient, pub: SupabaseClient) {
  console.log("\n== B. Partner form ==");

  const page = await httpGet("/pages/become-our-partner");
  record(
    "B",
    "B.pageLoads",
    page.status === 200 && /Become Our Partner/i.test(page.text),
    `GET /pages/become-our-partner → ${page.status} html=${page.text.length}b`,
  );
  record(
    "B",
    "B.htmlHasForm",
    /name="company_name"/.test(page.text) && /name="email_address"/.test(page.text),
    /name="company_name"/.test(page.text)
      ? "form fields present in HTML"
      : "company_name/email_address missing from HTML (client-only render?)",
  );
  record(
    "B",
    "B.htmlRequiredAttrs",
    /required/.test(page.text),
    "HTML required attributes present (client validation only unless server also checks)",
  );

  const csp = page.headers.get("content-security-policy") || "";
  const localHasFs = /formsubmit\.co/.test(csp);
  record(
    "B",
    "B.localCspHasFormsubmit",
    true,
    localHasFs
      ? "NOTE: localhost CSP includes formsubmit.co (Agent 2's claimed fix). This is not production."
      : `localhost CSP still lacks formsubmit.co: ${csp.match(/connect-src[^;]*/)?.[0] || "(missing)"}`,
    { cspConnect: csp.match(/connect-src[^;]*/)?.[0] || null },
  );

  try {
    const prod = await fetch("https://orientlighting.com.pk/pages/become-our-partner", {
      method: "HEAD",
      redirect: "follow",
    });
    const prodCsp = prod.headers.get("content-security-policy") || "";
    const prodHasFs = /formsubmit\.co/.test(prodCsp);
    const clientStillPosts = /formsubmit\.co/.test(src("src/components/partner/PartnerApplicationForm.tsx"));
    record(
      "B",
      "B.prodCspHasFormsubmit",
      !clientStillPosts || prodHasFs,
      clientStillPosts && !prodHasFs
        ? `AGENT2 FAIL: client FormSubmit + production CSP blocks it. ${prodCsp.match(/connect-src[^;]*/)?.[0] || "(no CSP)"}`
        : clientStillPosts
          ? "Production CSP includes formsubmit.co (client retry might work after deploy)"
          : `Client FormSubmit removed. Production CSP still has no formsubmit.co (correct if it stays removed): ${prodCsp.match(/connect-src[^;]*/)?.[0] || "(no CSP)"}`,
      { status: prod.status, cspConnect: prodCsp.match(/connect-src[^;]*/)?.[0] || null },
    );
  } catch (e) {
    record(
      "B",
      "B.prodCspHasFormsubmit",
      false,
      `Could not HEAD production: ${e instanceof Error ? e.message : e}`,
    );
  }

  const health = await httpGet("/api/email/health");
  let healthJson: Record<string, unknown> = {};
  try {
    healthJson = JSON.parse(health.text) as Record<string, unknown>;
  } catch {
    healthJson = {};
  }
  record(
    "B",
    "B.emailHealth",
    health.status === 200,
    `GET /api/email/health → ${health.status} preferred=${healthJson.preferredProvider} gmail=${JSON.stringify((healthJson.gmail as object) || {})}`,
    { status: health.status, body: healthJson },
  );

  const gmailSet = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  const resendSet = Boolean(process.env.RESEND_API_KEY);
  record(
    "B",
    "B.emailProviderConfigured",
    gmailSet || resendSet,
    gmailSet || resendSet
      ? "Gmail or Resend configured in .env.local"
      : "NO GMAIL_USER/GMAIL_APP_PASSWORD and NO RESEND_API_KEY — partner notify depends on FormSubmit",
  );
  record(
    "B",
    "B.emailHealthSecret",
    Boolean(process.env.EMAIL_HEALTH_SECRET),
    process.env.EMAIL_HEALTH_SECRET
      ? "EMAIL_HEALTH_SECRET set (POST /api/email/health can send a test)"
      : "EMAIL_HEALTH_SECRET missing — cannot prove a real email leaves the box without spamming sales@",
  );

  const { error: anonIns } = await pub.from("partner_applications").insert({
    company_name: "QA-ADV-ANON-SHOULD-FAIL",
    contact_person_name: "Nope",
    designation: "Nope",
    mobile_number: "03000000000",
    email_address: "qa-anon@example.invalid",
    city: "Lahore",
    business_type: "QA",
    years_in_business: "0",
    led_experience: "no",
    areas_served: "none",
    average_sales_revenue: "0",
    why_partner: "should fail",
  });
  record(
    "B",
    "B.anonInsertRejected",
    !!anonIns,
    anonIns ? `anon insert rejected: ${anonIns.message}` : "ANON INSERT SUCCEEDED — partner_applications missing INSERT RLS is being bypassed",
  );

  const company = `QA-ADV-LOOP${LOOP}-${Date.now()}`;
  const { data: row, error: insErr } = await admin
    .from("partner_applications")
    .insert({
      company_name: company,
      contact_person_name: "QA Dummy Contact",
      designation: "QA Tester",
      mobile_number: "+92 300 0000000",
      email_address: `qa-loop${LOOP}@example.invalid`,
      city: "Lahore",
      business_type: "Wholesaler",
      years_in_business: "3",
      led_experience: "Dummy LED experience for adversarial QA",
      areas_served: "Lahore QA district",
      average_sales_revenue: "PKR 0 (fixture)",
      why_partner: "Prove insert + select, then delete. Do not email.",
      additional_comments: "adversarial-qa",
    })
    .select("id, company_name, email_address")
    .maybeSingle();
  const { data: leftovers } = await admin
    .from("partner_applications")
    .select("id, company_name, email_address, created_at")
    .in("email_address", AGENT2_LEFTOVER_EMAILS);
  record(
    "B",
    "B.agent2LeftoverRowsFound",
    (leftovers?.length || 0) > 0 || LOOP > 1,
    leftovers?.length
      ? `verified Agent 2 leftovers: ${leftovers.map((r) => `${r.email_address} (${r.company_name})`).join("; ")}`
      : LOOP > 1
        ? "already deleted in an earlier loop"
        : "Agent 2 leftover emails not present (already cleaned or never inserted)",
    { leftovers },
  );
  if (leftovers?.length) {
    await admin.from("partner_applications").delete().in(
      "id",
      leftovers.map((r) => r.id),
    );
    const { data: leftoverGone } = await admin
      .from("partner_applications")
      .select("id")
      .in("email_address", AGENT2_LEFTOVER_EMAILS);
    record(
      "B",
      "B.agent2LeftoversDeleted",
      (leftoverGone?.length || 0) === 0,
      leftoverGone?.length ? `still present: ${leftoverGone.length}` : `deleted ${leftovers.length} leftover QA rows`,
    );
  } else {
    record("B", "B.agent2LeftoversDeleted", true, "nothing to delete");
  }

  const partnersGate = await httpGet("/admin/partners");
  record(
    "B",
    "B.adminPartnersGated",
    (partnersGate.status === 307 || partnersGate.status === 302) &&
      partnersGate.location.includes("/admin/login"),
    `GET /admin/partners → ${partnersGate.status} loc=${partnersGate.location}`,
  );

  record("B", "B.serviceInsert", !insErr && !!row, insErr ? insErr.message : `inserted id=${row?.id}`);

  const { data: anonSee } = await pub
    .from("partner_applications")
    .select("id")
    .eq("company_name", company)
    .maybeSingle();
  record(
    "B",
    "B.anonCannotReadApps",
    !anonSee,
    anonSee ? "ANON CAN READ partner_applications — PII leak" : "anon cannot SELECT partner rows (expected)",
  );

  if (row?.id) {
    const { data: persisted } = await admin
      .from("partner_applications")
      .select("id, company_name")
      .eq("id", row.id)
      .maybeSingle();
    record("B", "B.rowPersisted", persisted?.company_name === company, `row ${row.id} company=${persisted?.company_name}`);
    const { data: inbox } = await admin
      .from("partner_applications")
      .select("id, email_address")
      .eq("id", row.id)
      .maybeSingle();
    record(
      "B",
      "B.adminInboxWouldSee",
      inbox?.id === row.id,
      inbox
        ? `listPartnerApplications query would include ${inbox.email_address} (same SELECT as /admin/partners)`
        : "inserted row not visible to service-role SELECT used by /admin/partners",
    );
    await admin.from("partner_applications").delete().eq("id", row.id);
    const { data: gone } = await admin.from("partner_applications").select("id").eq("id", row.id).maybeSingle();
    record("B", "B.rowCleaned", !gone, gone ? "cleanup failed" : "QA partner row deleted");
  } else {
    record("B", "B.rowPersisted", false, "no row to persist-check");
    record("B", "B.rowCleaned", false, "no row to clean");
  }
}

async function sectionC(admin: SupabaseClient, pub: SupabaseClient) {
  console.log("\n== C. Per-product catalogs ==");

  const { data: productCols, error: colErr } = await admin
    .from("products")
    .select("*")
    .limit(1)
    .maybeSingle();
  const keys = productCols ? Object.keys(productCols) : [];
  const catalogueKeys = keys.filter((k) => /catalog/i.test(k));
  record(
    "C",
    "C.productsHaveCatalogueColumn",
    catalogueKeys.length > 0,
    catalogueKeys.length
      ? `found columns: ${catalogueKeys.join(",")}`
      : `products columns have no catalogue field (keys sample: ${keys.slice(0, 12).join(",")})`,
    { catalogueKeys, allKeys: keys },
  );
  void colErr;

  const { data: setting } = await pub.from("site_settings").select("key, value").eq("key", "catalogue").maybeSingle();
  const globalUrl = (setting?.value as { url?: string } | null)?.url || "";
  record(
    "C",
    "C.globalSettingExists",
    !!setting,
    `site_settings.catalogue url=${globalUrl || "(none)"}`,
    { value: setting?.value },
  );

  const stamp = Date.now();
  const p1 = {
    id: `${PREFIX}_p1_${LOOP}_${stamp}`,
    handle: `${HANDLE_PREFIX}-p1-${LOOP}-${stamp}`,
    title: `QA Adv Product 1 Loop ${LOOP}`,
  };
  const p2 = {
    id: `${PREFIX}_p2_${LOOP}_${stamp}`,
    handle: `${HANDLE_PREFIX}-p2-${LOOP}-${stamp}`,
    title: `QA Adv Product 2 Loop ${LOOP}`,
  };

  const pdfA = tinyPdf("QA-CATALOG-PRODUCT-1");
  const pdfB = tinyPdf("QA-CATALOG-PRODUCT-2");
  const pathA = `${STORAGE_PREFIX}/catalog-A.pdf`;
  const pathB = `${STORAGE_PREFIX}/catalog-B.pdf`;

  const upA = await admin.storage.from("catalogues").upload(pathA, pdfA, {
    contentType: "application/pdf",
    upsert: true,
  });
  const upB = await admin.storage.from("catalogues").upload(pathB, pdfB, {
    contentType: "application/pdf",
    upsert: true,
  });
  record("C", "C.uploadCatalogA", !upA.error, upA.error ? upA.error.message : `A → ${pathA}`);
  record("C", "C.uploadCatalogB", !upB.error, upB.error ? upB.error.message : `B → ${pathB}`);

  const urlA = admin.storage.from("catalogues").getPublicUrl(pathA).data.publicUrl;
  const urlB = admin.storage.from("catalogues").getPublicUrl(pathB).data.publicUrl;
  const getA = await headOrGet(urlA);
  const getB = await headOrGet(urlB);
  record(
    "C",
    "C.catalogAReachable",
    getA.status === 200 && getA.buf.includes(Buffer.from("QA-CATALOG-PRODUCT-1")),
    `GET A HTTP ${getA.status} bytes=${getA.bytes} marker=${getA.buf.includes(Buffer.from("QA-CATALOG-PRODUCT-1"))} type=${getA.contentType}`,
    { url: urlA, status: getA.status },
  );
  record(
    "C",
    "C.catalogBReachable",
    getB.status === 200 && getB.buf.includes(Buffer.from("QA-CATALOG-PRODUCT-2")),
    `GET B HTTP ${getB.status} bytes=${getB.bytes} marker=${getB.buf.includes(Buffer.from("QA-CATALOG-PRODUCT-2"))} type=${getB.contentType}`,
    { url: urlB, status: getB.status },
  );
  record(
    "C",
    "C.catalogsAreDistinct",
    createHash("sha256").update(getA.buf).digest("hex") !==
      createHash("sha256").update(getB.buf).digest("hex"),
    "catalog A and B bytes differ",
  );

  const { error: anonCat } = await pub.storage.from("catalogues").upload(`${pathA}-anon.pdf`, pdfA, {
    contentType: "application/pdf",
  });
  record(
    "C",
    "C.anonCatalogUploadRejected",
    !!anonCat,
    anonCat ? `anon catalogue upload rejected: ${anonCat.message}` : "ANON uploaded to catalogues bucket — storage RLS gap",
  );

  const p3 = {
    id: `${PREFIX}_p3_${LOOP}_${stamp}`,
    handle: `${HANDLE_PREFIX}-p3-${LOOP}-${stamp}`,
    title: `QA Adv Product 3 Loop ${LOOP} (no PDF)`,
  };

  async function insertProduct(
    p: { id: string; handle: string; title: string },
    cat?: { url: string; filename: string; storagePath: string },
  ) {
    return admin.from("products").insert({
      id: p.id,
      handle: p.handle,
      title: p.title,
      description: `QA adversarial ${p.title}`,
      price: 999,
      compare_at_price: null,
      sku: "",
      product_type: "QA",
      vendor: "Orient",
      status: "published",
      images: [],
      variants: [{ id: `${p.id}_v0`, title: "Default", price: 999, sku: "", available: true }],
      options: [],
      tags: ["qa-adversarial"],
      facets: { wattage: [], colorTemp: [] },
      seo_title: p.title,
      seo_description: "qa",
      catalogue_url: cat?.url ?? null,
      catalogue_filename: cat?.filename ?? null,
      catalogue_storage_path: cat?.storagePath ?? null,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const i1 = await insertProduct(p1, { url: urlA, filename: "qa-catalog-A.pdf", storagePath: pathA });
  const i2 = await insertProduct(p2, { url: urlB, filename: "qa-catalog-B.pdf", storagePath: pathB });
  const i3 = await insertProduct(p3);
  record("C", "C.createProduct1", !i1.error, i1.error ? i1.error.message : p1.handle);
  record("C", "C.createProduct2", !i2.error, i2.error ? i2.error.message : p2.handle);
  record("C", "C.createProduct3NoPdf", !i3.error, i3.error ? i3.error.message : p3.handle);

  const { data: row1 } = await admin
    .from("products")
    .select("catalogue_url")
    .eq("id", p1.id)
    .maybeSingle();
  const { data: row2 } = await admin
    .from("products")
    .select("catalogue_url")
    .eq("id", p2.id)
    .maybeSingle();
  record(
    "C",
    "C.dbRowHasDistinctUrls",
    row1?.catalogue_url === urlA && row2?.catalogue_url === urlB,
    `p1.catalogue_url=${row1?.catalogue_url} p2.catalogue_url=${row2?.catalogue_url}`,
  );

  async function httpGetRetry(path: string) {
    let last = await httpGet(path);
    for (let i = 0; i < 3 && (last.status === 500 || last.status === 404); i++) {
      await new Promise((r) => setTimeout(r, 1500));
      last = await httpGet(path);
    }
    return last;
  }

  const page1 = await httpGetRetry(`/products/${p1.handle}`);
  const page2 = await httpGetRetry(`/products/${p2.handle}`);
  const page3 = await httpGetRetry(`/products/${p3.handle}`);
  record("C", "C.pdp1", page1.status === 200, `/products/${p1.handle} → ${page1.status}`);
  record("C", "C.pdp2", page2.status === 200, `/products/${p2.handle} → ${page2.status}`);
  record("C", "C.pdp3", page3.status === 200, `/products/${p3.handle} → ${page3.status}`);

  const hrefs = (html: string) =>
    [...html.matchAll(/href="([^"]*catalogue[^"]*)"/gi), ...html.matchAll(/href="([^"]+\.pdf)"/gi)].map(
      (m) => m[1],
    );

  const h1 = hrefs(page1.text);
  const h2 = hrefs(page2.text);
  const h3 = hrefs(page3.text);
  const distinct =
    h1.length > 0 &&
    h2.length > 0 &&
    h1.some((u) => u.includes("catalog-A") || u === urlA || u.includes("QA-CATALOG-PRODUCT-1")) &&
    h2.some((u) => u.includes("catalog-B") || u === urlB || u.includes("QA-CATALOG-PRODUCT-2")) &&
    JSON.stringify(h1) !== JSON.stringify(h2);

  record(
    "C",
    "C.storefrontServesDistinctCatalogs",
    distinct,
    distinct
      ? `product1 hrefs=${h1.join(" | ")} product2 hrefs=${h2.join(" | ")}`
      : `SAME/GLOBAL catalogue on both PDPs. p1=${h1.join(" | ") || "(none)"} p2=${h2.join(" | ") || "(none)"} globalSetting=${globalUrl}`,
    { h1, h2, globalUrl, urlA, urlB },
  );

  const bothGlobal =
    h1.some((u) => u.includes("orient-lighting-catalogue.pdf")) &&
    h2.some((u) => u.includes("orient-lighting-catalogue.pdf"));
  record(
    "C",
    "C.notStillOneGlobalPdf",
    page1.status === 200 && page2.status === 200 && !bothGlobal,
    bothGlobal
      ? "Both PDPs still link /orient-lighting-catalogue.pdf — per-product catalogs NOT implemented"
      : page1.status !== 200 || page2.status !== 200
        ? "Cannot certify: one or both PDPs failed to render"
        : "PDPs are not both pointing at the static global PDF",
  );

  const p3FallsBack =
    page3.status === 200 &&
    h3.some((u) => u.includes("orient-lighting-catalogue.pdf") || u === globalUrl) &&
    !h3.some((u) => u.includes("catalog-A") || u.includes("catalog-B") || u === urlA || u === urlB);
  record(
    "C",
    "C.product3FallsBackToGlobal",
    p3FallsBack,
    p3FallsBack
      ? `product3 (no catalogue_url) hrefs=${h3.join(" | ")} — global fallback as claimed`
      : `product3 did not uniquely fall back to global PDF. hrefs=${h3.join(" | ") || "(none)"}`,
    { h3, globalUrl },
  );

  const tripleDistinct =
    distinct &&
    p3FallsBack &&
    !h1.some((u) => u.includes("orient-lighting-catalogue.pdf")) &&
    !h2.some((u) => u.includes("orient-lighting-catalogue.pdf"));
  record(
    "C",
    "C.AneBneGlobal",
    tripleDistinct,
    tripleDistinct
      ? "A ≠ B ≠ global fallback"
      : "Could not prove three-way distinct (A vs B vs /orient-lighting-catalogue.pdf)",
  );

  record(
    "C",
    "C.hiddenFieldsPersistOnSaveOnly",
    true,
    "NOTE: catalogue_url is written on product INSERT/UPDATE (Save). uploadProductCatalogueFile only returns a URL for hidden fields — navigate-away orphans the storage object.",
  );

  await admin.from("products").delete().in("id", [p1.id, p2.id, p3.id]);
}

async function sectionD(admin: SupabaseClient, pub: SupabaseClient) {
  console.log("\n== D. Regression ==");
  const home = await httpGet("/");
  record("D", "D.home", home.status === 200, `GET / → ${home.status}`);

  const pdf = await httpGet("/orient-lighting-catalogue.pdf");
  record(
    "D",
    "D.existingStaticCatalogue",
    pdf.status === 200 && pdf.text.length > 1000,
    `GET /orient-lighting-catalogue.pdf → ${pdf.status} bytes≈${pdf.text.length}`,
  );

  const login = await httpGet("/admin/login");
  record("D", "D.adminLogin", login.status === 200, `GET /admin/login → ${login.status}`);

  const gate = await httpGet("/admin/products");
  record(
    "D",
    "D.adminAuthGate",
    (gate.status === 307 || gate.status === 302) && gate.location.includes("/admin/login"),
    `unauth /admin/products → ${gate.status} loc=${gate.location}`,
  );

  const partnerRoute = await httpGet("/pages/become-our-partner");
  record("D", "D.partnerRoute", partnerRoute.status === 200, `partner page ${partnerRoute.status}`);

  const { data: published, error: pErr } = await pub
    .from("products")
    .select("id, handle")
    .eq("status", "published")
    .limit(3);
  record("D", "D.publishedProducts", !pErr && (published?.length || 0) > 0, pErr?.message || `n=${published?.length}`);

  if (published?.[0]?.handle) {
    const pdp = await httpGet(`/products/${published[0].handle}`);
    record("D", "D.livePdp", pdp.status === 200, `/products/${published[0].handle} → ${pdp.status}`);
  }

  const { error: anonWrite } = await pub.from("products").update({ title: "hacked" }).eq("id", published?.[0]?.id || "nope");
  record(
    "D",
    "D.anonCannotUpdateProduct",
    true,
    anonWrite ? `anon update error: ${anonWrite.message}` : "anon update returned no error (0-row under RLS is OK if title unchanged)",
  );
  if (published?.[0]?.id) {
    const { data: still } = await admin.from("products").select("title").eq("id", published[0].id).maybeSingle();
    record("D", "D.productTitleUnchanged", still?.title !== "hacked", `title still ${still?.title?.slice(0, 40)}`);
  }

  const id = `${PREFIX}_crud_${LOOP}_${Date.now()}`;
  const handle = `${HANDLE_PREFIX}-crud-${LOOP}-${Date.now()}`;
  const { error: cErr } = await admin.from("products").insert({
    id,
    handle,
    title: "QA CRUD",
    description: "crud",
    price: 10,
    sku: "",
    product_type: "QA",
    vendor: "Orient",
    status: "draft",
    images: [],
    variants: [],
    options: [],
    tags: ["qa-adversarial"],
    facets: { wattage: [], colorTemp: [] },
    seo_title: "QA CRUD",
    seo_description: "qa",
    published_at: null,
    updated_at: new Date().toISOString(),
  });
  record("D", "D.crudCreate", !cErr, cErr?.message || id);
  const { error: uErr } = await admin.from("products").update({ title: "QA CRUD UPDATED", status: "published", published_at: new Date().toISOString() }).eq("id", id);
  record("D", "D.crudUpdate", !uErr, uErr?.message || "updated");
  const { data: vis } = await pub.from("products").select("title").eq("handle", handle).eq("status", "published").maybeSingle();
  record("D", "D.crudPublicRead", vis?.title === "QA CRUD UPDATED", `anon title=${vis?.title}`);
  const { error: dErr } = await admin.from("products").delete().eq("id", id);
  record("D", "D.crudDelete", !dErr, dErr?.message || "deleted");
}

async function main() {
  console.log(`\n======== Orient adversarial QA — LOOP ${LOOP} ========`);
  console.log(`base=${local}`);
  console.log(`supabase=${url || "(missing)"}`);
  console.log(
    `env: SERVICE_ROLE=${service ? "set" : "MISSING"} ANON=${anon ? "set" : "MISSING"} ADMIN_EMAIL=${process.env.ADMIN_EMAIL ? "set" : "MISSING"} GMAIL=${process.env.GMAIL_USER ? "set" : "missing"} RESEND=${process.env.RESEND_API_KEY ? "set" : "missing"} EMAIL_HEALTH_SECRET=${process.env.EMAIL_HEALTH_SECRET ? "set" : "missing"}`,
  );

  if (!url || !service || !anon) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(2);
  }

  writeFixtures();
  inspectSource();

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const pub = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });

  await cleanup(admin);
  try {
    await sectionA(admin, pub);
    await sectionB(admin, pub);
    await sectionC(admin, pub);
    await sectionD(admin, pub);
  } finally {
    await cleanup(admin);
    await admin.from("partner_applications").delete().in("email_address", AGENT2_LEFTOVER_EMAILS);
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  const out = {
    loop: LOOP,
    ts: new Date().toISOString(),
    base: local,
    passed,
    failed,
    results,
  };
  const outPath = join(process.cwd(), `scripts/qa-adversarial-loop-${LOOP}.json`);
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`\n—— LOOP ${LOOP}: ${passed} passed, ${failed} failed ——`);
  console.log(`wrote ${outPath}`);
  if (failed) {
    console.log("FAILURES:");
    for (const r of results.filter((x) => !x.pass)) {
      console.log(` - [${r.area}] ${r.id}: ${r.detail}`);
    }
    process.exitCode = 1;
  } else {
    console.log("ALL CASES PASSED");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
