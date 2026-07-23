"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

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
  const { data: allowlist, error } = await sb.from("admin_users").select("email");
  if (error) throw new Error(`admin allowlist: ${error.message}`);
  const ok = (allowlist || []).some(
    (r) => r.email.toLowerCase() === user!.email!.toLowerCase(),
  );
  if (!ok) throw new Error("Unauthorized");

  return user!;
}

function revalidateCatalog(handles: string[], collectionHandles: string[]) {
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/compare");
  revalidatePath("/sitemap.xml");
  for (const h of handles) revalidatePath(`/products/${h}`);
  for (const h of collectionHandles) revalidatePath(`/collections/${h}`);
}

export async function logoutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
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
  const description = String(formData.get("description") || "");
  const priceRaw = String(formData.get("price") || "").trim();
  const compareRaw = String(formData.get("compareAtPrice") || "").trim();
  const sku = String(formData.get("sku") || "").trim();
  const productType = String(formData.get("productType") || "").trim();
  const vendor = String(formData.get("vendor") || "Orient").trim() || "Orient";
  const status = String(formData.get("status") || "draft") === "published" ? "published" : "draft";
  const wattage = String(formData.get("wattage") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const colorTemp = String(formData.get("colorTemp") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const optionsText = String(formData.get("options") || "").trim();
  const imagesRaw = String(formData.get("images") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const collectionHandles = formData.getAll("collections").map(String);

  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = "Title is required.";
  if (!handle) fieldErrors.handle = "Handle is required.";
  const price = Number(priceRaw);
  if (!priceRaw || Number.isNaN(price) || price <= 0) {
    fieldErrors.price = "Price must be a positive number.";
  }
  let compareAtPrice: number | null = null;
  if (compareRaw) {
    compareAtPrice = Number(compareRaw);
    if (Number.isNaN(compareAtPrice) || compareAtPrice < 0) {
      fieldErrors.compareAtPrice = "Compare-at price must be a number.";
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
      sku,
      productType,
      vendor,
      status: status as "draft" | "published",
      wattage,
      colorTemp,
      optionsText,
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
  const options = data.optionsText
    ? [{ name: "Options", values: data.optionsText.split(",").map((s) => s.trim()).filter(Boolean) }]
    : [];

  const { error } = await sb.from("products").insert({
    id,
    handle: data.handle,
    title: data.title,
    description: data.description,
    price: data.price,
    compare_at_price: data.compareAtPrice,
    sku: data.sku,
    product_type: data.productType,
    vendor: data.vendor,
    status: data.status,
    images: data.images,
    variants: [
      {
        id: `${id}_v0`,
        title: "Default",
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        sku: data.sku,
        available: true,
      },
    ],
    options,
    tags: [],
    facets: { wattage: data.wattage, colorTemp: data.colorTemp },
    seo_title: data.title,
    seo_description: data.description.replace(/<[^>]+>/g, "").slice(0, 160),
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

  const options = data.optionsText
    ? [{ name: "Options", values: data.optionsText.split(",").map((s) => s.trim()).filter(Boolean) }]
    : [];

  const { error } = await sb
    .from("products")
    .update({
      handle: data.handle,
      title: data.title,
      description: data.description,
      price: data.price,
      compare_at_price: data.compareAtPrice,
      sku: data.sku,
      product_type: data.productType,
      vendor: data.vendor,
      status: data.status,
      images: data.images,
      options,
      facets: { wattage: data.wattage, colorTemp: data.colorTemp },
      seo_title: data.title,
      seo_description: data.description.replace(/<[^>]+>/g, "").slice(0, 160),
      published_at:
        data.status === "published"
          ? current.published_at ?? new Date().toISOString()
          : current.published_at,
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
  if (!file.type.startsWith("image/")) {
    return { error: "Only image files are allowed." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Image must be under 5MB." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const sb = createServiceClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await sb.storage.from("product-images").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { error: error.message };

  const { data } = sb.storage.from("product-images").getPublicUrl(path);
  return { url: data.publicUrl };
}
