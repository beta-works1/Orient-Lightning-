/**
 * Client-only product-catalogue upload.
 * Bytes go to Storage via Agent 1's signed slot (createSignedUploadSlot) — not a server-action body.
 */
import { uploadAdminFile } from "@/lib/upload/browser";

export async function uploadProductCatalogueFile(
  file: File,
  productId?: string,
): Promise<
  | { ok: true; url: string; filename: string; storagePath: string }
  | { ok: false; error: string }
> {
  const safeId = (productId || "").replace(/[^a-zA-Z0-9_-]/g, "");
  const folder = safeId ? `products/${safeId}` : "products/pending";
  const res = await uploadAdminFile({ purpose: "catalogue", file, folder });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, url: res.url, filename: res.filename, storagePath: res.path };
}
