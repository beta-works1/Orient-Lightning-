/**
 * Product/site catalogue PDFs — thin wrapper over Agent 1's shared upload helper.
 * Do not add a second bucket or MIME stack. Contract: PDF-only, 25MB, `catalogues` bucket.
 *
 * uploadCataloguePdfFromForm posts bytes through the Next server (scripts / leftover
 * server-action fallback only). ProductForm and CatalogueAdminForm MUST use signed PUT
 * via uploadAdminFile / uploadProductCatalogueFile — never this function.
 */
import { blobFileName, readFormFile } from "@/lib/upload/formFile";
import { removeStorageObject, uploadBytesToBucket } from "@/lib/upload/storage";
import { PDF_MAX_BYTES } from "@/lib/upload/types";

export const CATALOGUE_MAX_BYTES = PDF_MAX_BYTES;

export type CatalogueUploadResult =
  | { ok: true; url: string; filename: string; storagePath: string }
  | { ok: false; error: string };

export async function uploadCataloguePdfFromForm(
  formData: FormData,
  folder: string,
): Promise<CatalogueUploadResult> {
  const file = await readFormFile(formData);
  if (!file.ok) return { ok: false, error: "Choose a PDF file." };

  const uploaded = await uploadBytesToBucket({
    purpose: "catalogue",
    bytes: file.bytes,
    fileName: blobFileName(file.blob, "catalogue.pdf"),
    folder,
  });
  if (!uploaded.ok) return { ok: false, error: uploaded.error };

  return {
    ok: true,
    url: uploaded.url,
    filename: uploaded.filename,
    storagePath: uploaded.path,
  };
}

export async function removeCatalogueObject(
  storagePath: string | null | undefined,
): Promise<void> {
  await removeStorageObject("catalogue", storagePath);
}
