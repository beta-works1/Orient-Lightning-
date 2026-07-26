"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  buildVariantsFromAdminFields,
  normalizeProductDescription,
  stripHtml,
} from "@/lib/adminProductOptions";
import type { ProductVariant } from "@/lib/types";
import type { CatalogueSetting } from "@/lib/catalogueSettings";
import { logoutAdmin } from "@/app/admin/logout";
import { detectFileKind, extForKind, mimeForKind } from "@/lib/fileMagic";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

export { logoutAdmin };

function assertAdminEmail(email: string | undefined) {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!admin || !email || email.toLowerCase() !== admin) {
    throw new Error("Unauthorized");
  }
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  assertAdminEmail(user?.email);

  const sb = createServiceClient();
  const { data: row, error } = await sb
    .from("admin_users")
    .select("email")
    .ilike("email", user!.email!)
    .maybeSingle();
  if (error) throw new Error(`admin allowlist: ${error.message}`);
  if (!row) throw new Error("Unauthorized");

  return user!;
}

function revalidateCatalog(handles: string[], collectionHandles: string[]) {
  revalidateTag("catalog");
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/compare");
  revalidatePath("/sitemap.xml");
  for (const h of handles) revalidatePath(`/products/${h}`);
  for (const h of collectionHandles) revalidatePath(`/collections/${h}`);
}

export type ProductFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseForm(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const handle = String(formData.get("handle") || "").trim() || slugify(title);
  const description = sanitizeHtml(
    normalizeProductDescription(String(formData.get("description") || "")),
  );
  const priceRaw = String(formData.get("price") || "").trim();
  const compareRaw = String(formData.get("compareAtPrice") || "").trim();
  const productType = String(formData.get("productType") || "").trim();
  const status = String(formData.get("status") || "draft") === "published" ? "published" : "draft";
  const wattage = String(formData.get("wattage") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const colorTemp = String(formData.get("colorTemp") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const styles = String(formData.get("options") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const imagesRaw = String(formData.get("images") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const collectionHandles = formData.getAll("collections").map(String);

  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = "Title is required.";
  if (!handle) fieldErrors.handle = "Product link is required.";
  const price = Number(priceRaw);
  if (!priceRaw || Number.isNaN(price) || price <= 0) {
    fieldErrors.price = "Price must be a positive number.";
  }
  let compareAtPrice: number | null = null;
  if (compareRaw) {
    compareAtPrice = Number(compareRaw);
    if (Number.isNaN(compareAtPrice) || compareAtPrice < 0) {
      fieldErrors.compareAtPrice = "Was price must be a number.";
    }
  }

  return {
    fieldErrors,
    data: {
      title,
      handle,
      description,
      price,
      compareAtPrice,
      productType,
      status: status as "draft" | "published",
      wattage,
      colorTemp,
      styles,
      images: imagesRaw,
      collectionHandles,
    },
  };
}

async function syncCollections(productId: string, collectionHandles: string[]) {
  const sb = createServiceClient();
  const { data: cols, error: colErr } = await sb.from("collections").select("id, handle");
  if (colErr) throw new Error(colErr.message);

  const byHandle = new Map((cols || []).map((c) => [c.handle, c.id]));
  await sb.from("product_collections").delete().eq("product_id", productId);

  const rows = collectionHandles
    .map((h) => byHandle.get(h))
    .filter(Boolean)
    .map((collection_id) => ({ product_id: productId, collection_id: collection_id as string }));

  if (rows.length) {
    const { error } = await sb.from("product_collections").insert(rows);
    if (error) throw new Error(error.message);
  }
}

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const { fieldErrors, data } = parseForm(formData);
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const sb = createServiceClient();
  const { data: existing } = await sb
    .from("products")
    .select("id")
    .eq("handle", data.handle)
    .maybeSingle();
  if (existing) return { fieldErrors: { handle: "Handle already exists." } };

  const id = `admin_${Date.now()}`;
  const { options, variants } = buildVariantsFromAdminFields({
    productId: id,
    price: data.price,
    compareAtPrice: data.compareAtPrice,
    wattages: data.wattage,
    colorTemps: data.colorTemp,
    styles: data.styles,
  });

  const { error } = await sb.from("products").insert({
    id,
    handle: data.handle,
    title: data.title,
    description: data.description,
    price: data.price,
    compare_at_price: data.compareAtPrice,
    sku: "",
    product_type: data.productType,
    vendor: "Orient",
    status: data.status,
    images: data.images,
    variants,
    options,
    tags: [],
    facets: { wattage: data.wattage, colorTemp: data.colorTemp },
    seo_title: data.title,
    seo_description: stripHtml(data.description).slice(0, 160),
    published_at: data.status === "published" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  await syncCollections(id, data.collectionHandles);
  revalidateCatalog([data.handle], data.collectionHandles);
  redirect(`/admin/products/${id}?saved=1`);
}

export async function updateProduct(
  id: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const { fieldErrors, data } = parseForm(formData);
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const sb = createServiceClient();
  const { data: current } = await sb.from("products").select("*").eq("id", id).maybeSingle();
  if (!current) return { error: "Product not found." };

  if (data.handle !== current.handle) {
    const { data: clash } = await sb
      .from("products")
      .select("id")
      .eq("handle", data.handle)
      .maybeSingle();
    if (clash) return { fieldErrors: { handle: "Handle already exists." } };
  }

  const existingVariants = (current.variants || []) as ProductVariant[];
  const { options, variants } = buildVariantsFromAdminFields({
    productId: id,
    price: data.price,
    compareAtPrice: data.compareAtPrice,
    wattages: data.wattage,
    colorTemps: data.colorTemp,
    styles: data.styles,
    existingVariants,
  });

  const { error } = await sb
    .from("products")
    .update({
      handle: data.handle,
      title: data.title,
      description: data.description,
      price: data.price,
      compare_at_price: data.compareAtPrice,
      product_type: data.productType,
      vendor: "Orient",
      status: data.status,
      images: data.images,
      variants,
      options,
      facets: { wattage: data.wattage, colorTemp: data.colorTemp },
      seo_title: data.title,
      seo_description: stripHtml(data.description).slice(0, 160),
      published_at:
        data.status === "published"
          ? current.published_at ?? new Date().toISOString()
          : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  await syncCollections(id, data.collectionHandles);
  revalidateCatalog([data.handle, current.handle].filter(Boolean), data.collectionHandles);
  redirect(`/admin/products/${id}?saved=1`);
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const sb = createServiceClient();
  const { data: current } = await sb.from("products").select("handle").eq("id", id).maybeSingle();
  if (!current) throw new Error("Not found");

  const { data: joins } = await sb
    .from("product_collections")
    .select("collections(handle)")
    .eq("product_id", id);

  const collectionHandles = (joins || [])
    .map((j) => (j as { collections?: { handle?: string } | null }).collections?.handle)
    .filter(Boolean) as string[];

  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateCatalog([current.handle], collectionHandles);
  redirect("/admin/products?deleted=1");
}

export async function uploadProductImage(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image file." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Image must be under 5MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = detectFileKind(buffer);
  if (!kind || kind === "pdf") {
    return { error: "Only JPG, PNG, WebP, GIF, or AVIF images are allowed." };
  }

  const ext = extForKind(kind);
  const contentType = mimeForKind(kind);
  const path = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const sb = createServiceClient();
  const { error } = await sb.storage.from("product-images").upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) return { error: "Upload failed. Try again." };

  const { data } = sb.storage.from("product-images").getPublicUrl(path);
  return { url: data.publicUrl };
}

export type CatalogueFormState = {
  ok?: boolean;
  error?: string;
};

async function saveCatalogueSetting(value: CatalogueSetting) {
  const sb = createServiceClient();
  const { error } = await sb.from("site_settings").upsert({
    key: "catalogue",
    value,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

function revalidateCataloguePaths() {
  revalidateTag("catalogue");
  revalidatePath("/");
  revalidatePath("/admin/catalogue");
}

export async function uploadCatalogue(
  _prev: CatalogueFormState,
  formData: FormData,
): Promise<CatalogueFormState> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a PDF file." };
  }

  if (file.size > 25 * 1024 * 1024) return { error: "PDF must be under 25MB." };

  const buffer = Buffer.from(await file.arrayBuffer());
  if (detectFileKind(buffer) !== "pdf") {
    return { error: "Only PDF catalogues are allowed." };
  }

  const sb = createServiceClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "catalogue.pdf";
  const storagePath = `current/${Date.now()}-${safeName}`;

  const { error: uploadError } = await sb.storage.from("catalogues").upload(storagePath, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  const { data } = sb.storage.from("catalogues").getPublicUrl(storagePath);
  const value: CatalogueSetting = {
    enabled: true,
    url: data.publicUrl,
    filename: safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`,
    storagePath,
  };

  try {
    await saveCatalogueSetting(value);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save catalogue setting." };
  }

  revalidateCataloguePaths();
  return { ok: true };
}

export async function removeCatalogue(
  prev: CatalogueFormState,
  formData: FormData,
): Promise<CatalogueFormState> {
  void prev;
  void formData;
  await requireAdmin();
  const sb = createServiceClient();

  const { data: row } = await sb
    .from("site_settings")
    .select("value")
    .eq("key", "catalogue")
    .maybeSingle();

  const current = (row?.value || {}) as Partial<CatalogueSetting>;
  if (current.storagePath) {
    await sb.storage.from("catalogues").remove([current.storagePath]);
  }

  const value: CatalogueSetting = {
    enabled: false,
    url: null,
    filename: "Orient-Lighting-Catalogue.pdf",
    storagePath: null,
  };

  try {
    await saveCatalogueSetting(value);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not remove catalogue." };
  }

  revalidateCataloguePaths();
  return { ok: true };
}

export type FeaturedFormState = {
  ok?: boolean;
  error?: string;
};

export async function saveFeaturedWeek(
  _prev: FeaturedFormState,
  formData: FormData,
): Promise<FeaturedFormState> {
  await requireAdmin();

  const title = String(formData.get("title") || "").trim() || "Featured this week";
  const viewAllHref =
    String(formData.get("viewAllHref") || "").trim() || "/collections/best-sellers";
  const handles = formData
    .getAll("handles")
    .map(String)
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, 12);

  const sb = createServiceClient();
  const { error } = await sb.from("site_settings").upsert({
    key: "featured_week",
    value: { handles, title, viewAllHref },
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  revalidateTag("featured");
  revalidateTag("catalog");
  revalidatePath("/");
  revalidatePath("/admin/featured");
  return { ok: true };
}
