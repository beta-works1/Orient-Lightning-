"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  buildVariantsFromAdminFields,
  normalizeProductDescription,
  resolveListPrice,
  stripHtml,
  type WattagePriceMap,
  type WattageSizeMap,
} from "@/lib/adminProductOptions";
import type { ProductVariant } from "@/lib/types";
import type { CatalogueSetting } from "@/lib/catalogueSettings";
import { removeCatalogueObject } from "@/lib/catalogueStorage";
import { blobFileName, readFormFile } from "@/lib/upload/formFile";
import { uploadBytesToBucket } from "@/lib/upload/storage";
import { messageFromThrown } from "@/lib/upload/validate";
import { usableProductImageUrls } from "@/lib/productImages";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

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
  redirectTo?: string;
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
  const imagesRaw = usableProductImageUrls(
    String(formData.get("images") || "")
      .split("\n")
      .map((s) => s.trim()),
  );
  const collectionHandles = formData.getAll("collections").map(String);
  const catalogueUrl = String(formData.get("catalogueUrl") || "").trim() || null;
  const catalogueFilename = String(formData.get("catalogueFilename") || "").trim() || null;
  const catalogueStoragePath = String(formData.get("catalogueStoragePath") || "").trim() || null;

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

  const wattagePrices: WattagePriceMap = {};
  const wattageSizes: WattageSizeMap = {};
  for (const watt of wattage) {
    const key = watt.match(/(\d+(?:\.\d+)?)/)?.[1];
    if (!key) continue;
    const numKey = String(Number(key));
    const sizeRaw = String(formData.get(`watt_size_${numKey}`) || "").trim();
    if (sizeRaw) wattageSizes[numKey] = sizeRaw;

    const wattPriceRaw = String(formData.get(`watt_price_${numKey}`) || "").trim();
    if (!wattPriceRaw) continue;
    const wattPrice = Number(wattPriceRaw);
    if (Number.isNaN(wattPrice) || wattPrice <= 0) {
      fieldErrors[`watt_price_${numKey}`] = `Price for ${numKey}W must be a positive number.`;
      continue;
    }
    let wattCompare: number | null = null;
    const wattCompareRaw = String(formData.get(`watt_compare_${numKey}`) || "").trim();
    if (wattCompareRaw) {
      wattCompare = Number(wattCompareRaw);
      if (Number.isNaN(wattCompare) || wattCompare < 0) {
        fieldErrors[`watt_compare_${numKey}`] = `Was price for ${numKey}W must be a number.`;
        continue;
      }
    }
    wattagePrices[numKey] = { price: wattPrice, compareAtPrice: wattCompare };
  }

  const listPrice =
    Number.isFinite(price) && price > 0 ? resolveListPrice(price, wattagePrices) : price;

  return {
    fieldErrors,
    data: {
      title,
      handle,
      description,
      price: listPrice,
      basePrice: Number.isFinite(price) && price > 0 ? price : listPrice,
      compareAtPrice,
      productType,
      status: status as "draft" | "published",
      wattage,
      colorTemp,
      styles,
      wattagePrices,
      wattageSizes,
      images: imagesRaw,
      collectionHandles,
      catalogueUrl,
      catalogueFilename,
      catalogueStoragePath,
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

async function createProductUnsafe(
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
    price: data.basePrice,
    compareAtPrice: data.compareAtPrice,
    wattages: data.wattage,
    colorTemps: data.colorTemp,
    styles: data.styles,
    wattagePrices: data.wattagePrices,
    wattageSizes: data.wattageSizes,
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
    catalogue_url: data.catalogueUrl,
    catalogue_filename: data.catalogueFilename,
    catalogue_storage_path: data.catalogueStoragePath,
    published_at: data.status === "published" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  await syncCollections(id, data.collectionHandles);
  revalidateCatalog([data.handle], data.collectionHandles);
  return { ok: true, redirectTo: `/admin/products/${id}?saved=1` };
}

export async function createProduct(
  prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  try {
    return await createProductUnsafe(prev, formData);
  } catch (error) {
    console.error("[admin createProduct]", error);
    return { error: messageFromThrown(error).error };
  }
}

async function updateProductUnsafe(
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
    price: data.basePrice,
    compareAtPrice: data.compareAtPrice,
    wattages: data.wattage,
    colorTemps: data.colorTemp,
    styles: data.styles,
    wattagePrices: data.wattagePrices,
    wattageSizes: data.wattageSizes,
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
      catalogue_url: data.catalogueUrl,
      catalogue_filename: data.catalogueFilename,
      catalogue_storage_path: data.catalogueStoragePath,
      published_at:
        data.status === "published"
          ? current.published_at ?? new Date().toISOString()
          : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  const previousPath =
    typeof current.catalogue_storage_path === "string" ? current.catalogue_storage_path : null;
  if (previousPath && previousPath !== data.catalogueStoragePath) {
    await removeCatalogueObject(previousPath);
  }

  await syncCollections(id, data.collectionHandles);
  revalidateCatalog([data.handle, current.handle].filter(Boolean), data.collectionHandles);
  return { ok: true, redirectTo: `/admin/products/${id}?saved=1` };
}

export async function updateProduct(
  id: string,
  prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  try {
    return await updateProductUnsafe(id, prev, formData);
  } catch (error) {
    console.error("[admin updateProduct]", error);
    return { error: messageFromThrown(error).error };
  }
}

export type DeleteProductState = {
  ok?: boolean;
  error?: string;
  redirectTo?: string;
};

async function deleteProductUnsafe(id: string): Promise<DeleteProductState> {
  await requireAdmin();
  const sb = createServiceClient();
  const { data: current } = await sb
    .from("products")
    .select("handle, catalogue_storage_path")
    .eq("id", id)
    .maybeSingle();
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

  if (typeof current.catalogue_storage_path === "string") {
    await removeCatalogueObject(current.catalogue_storage_path);
  }

  revalidateCatalog([current.handle], collectionHandles);
  return { ok: true, redirectTo: "/admin/products?deleted=1" };
}

export async function deleteProduct(id: string): Promise<DeleteProductState> {
  try {
    return await deleteProductUnsafe(id);
  } catch (error) {
    console.error("[admin deleteProduct]", error);
    return { error: messageFromThrown(error).error };
  }
}

export async function uploadProductImage(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: messageFromThrown(e).error };
  }

  const file = await readFormFile(formData);
  if (!file.ok) return { error: "Choose an image file." };

  const uploaded = await uploadBytesToBucket({
    purpose: "product-image",
    bytes: file.bytes,
    fileName: blobFileName(file.blob, "image"),
    folder: "uploads",
  });
  if (!uploaded.ok) return { error: uploaded.error };
  return { url: uploaded.url };
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

export async function removeCatalogue(
  prev: CatalogueFormState,
  formData: FormData,
): Promise<CatalogueFormState> {
  void prev;
  void formData;
  try {
    await requireAdmin();
  } catch (e) {
    return { error: messageFromThrown(e).error };
  }
  const sb = createServiceClient();

  const { data: row } = await sb
    .from("site_settings")
    .select("value")
    .eq("key", "catalogue")
    .maybeSingle();

  const current = (row?.value || {}) as Partial<CatalogueSetting>;
  await removeCatalogueObject(current.storagePath);

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

/** After the browser PUTs a PDF via signed URL (`uploadAdminFile`). */
export async function publishUploadedCatalogue(input: {
  url: string;
  filename: string;
  storagePath: string;
}): Promise<CatalogueFormState> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: messageFromThrown(e).error };
  }

  if (!input.url || !input.storagePath) {
    return { error: "Upload did not finish. Try again." };
  }

  const sb = createServiceClient();
  const { data: row } = await sb
    .from("site_settings")
    .select("value")
    .eq("key", "catalogue")
    .maybeSingle();
  const previous = (row?.value || {}) as Partial<CatalogueSetting>;

  const value: CatalogueSetting = {
    enabled: true,
    url: input.url,
    filename: input.filename || "catalogue.pdf",
    storagePath: input.storagePath,
  };

  try {
    await saveCatalogueSetting(value);
  } catch (e) {
    await removeCatalogueObject(input.storagePath);
    return { error: e instanceof Error ? e.message : "Could not save catalogue setting." };
  }

  if (previous.storagePath && previous.storagePath !== input.storagePath) {
    await removeCatalogueObject(previous.storagePath);
  }

  revalidateCataloguePaths();
  return { ok: true };
}

export type FeaturedFormState = {
  ok?: boolean;
  error?: string;
};

async function saveFeaturedWeekUnsafe(
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

export async function saveFeaturedWeek(
  prev: FeaturedFormState,
  formData: FormData,
): Promise<FeaturedFormState> {
  try {
    return await saveFeaturedWeekUnsafe(prev, formData);
  } catch (error) {
    console.error("[admin saveFeaturedWeek]", error);
    return { error: messageFromThrown(error).error };
  }
}
