import { prepareStorageUpload } from "@/app/admin/upload-actions";
import type { StorageUploadPurpose, UploadResult } from "@/lib/upload/types";
import { formatStorageHttpError, inspectBrowserFile, messageFromThrown } from "@/lib/upload/validate";

/**
 * Browser upload: validate locally, ask the server for a signed URL, PUT to R2 (or Supabase).
 * Import only from Client Components. Partner form / per-product PDFs should call this.
 */
export async function uploadAdminFile(opts: {
  purpose: StorageUploadPurpose;
  file: File;
  folder?: string;
}): Promise<UploadResult> {
  let inspected;
  try {
    inspected = await inspectBrowserFile(opts.file, opts.purpose);
  } catch (e) {
    return { ok: false, ...messageFromThrown(e) };
  }
  if (!inspected.ok) return inspected;

  let slot;
  try {
    slot = await prepareStorageUpload({
      purpose: opts.purpose,
      fileName: inspected.filename,
      size: inspected.size,
      contentType: inspected.contentType,
      folder: opts.folder,
    });
  } catch (e) {
    return { ok: false, ...messageFromThrown(e) };
  }
  if (!slot.ok) return slot;

  try {
    const res = await fetch(slot.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": inspected.contentType },
      body: opts.file,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: formatStorageHttpError(res.status, text),
        code: res.status === 401 || res.status === 403 ? "auth" : "storage",
      };
    }
  } catch (e) {
    return { ok: false, ...messageFromThrown(e) };
  }

  return {
    ok: true,
    url: slot.url,
    path: slot.path,
    filename: slot.filename,
    contentType: inspected.contentType,
    bucket: slot.bucket,
  };
}
