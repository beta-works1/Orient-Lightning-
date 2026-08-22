"use server";

import { requireAdmin } from "@/lib/adminAuth";
import { createSignedUploadSlot } from "@/lib/upload/storage";
import type { StorageUploadPurpose, UploadErr, UploadOk } from "@/lib/upload/types";

export type PrepareStorageUploadInput = {
  purpose: StorageUploadPurpose;
  fileName: string;
  size: number;
  contentType?: string;
  folder?: string;
};

export type PreparedUpload = (UploadOk & { signedUrl: string }) | UploadErr;

/**
 * Tiny JSON server action: returns a Supabase signed PUT URL.
 * The browser uploads bytes directly to Storage (avoids Next/Vercel body limits).
 */
export async function prepareStorageUpload(
  input: PrepareStorageUploadInput,
): Promise<PreparedUpload> {
  try {
    await requireAdmin();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unauthorized";
    if (/unauthorized/i.test(message)) {
      return { ok: false, error: "Session expired. Sign in again and retry.", code: "auth" };
    }
    return { ok: false, error: message.slice(0, 280), code: "auth" };
  }

  if (input.purpose !== "product-image" && input.purpose !== "catalogue") {
    return { ok: false, error: "Unknown upload type.", code: "bad_type" };
  }

  const slot = await createSignedUploadSlot({
    purpose: input.purpose,
    fileName: input.fileName,
    size: input.size,
    contentType: input.contentType,
    folder: input.folder,
  });
  if (!slot.ok) return slot;
  return {
    ok: true,
    url: slot.url,
    path: slot.path,
    filename: slot.filename,
    contentType: slot.contentType,
    bucket: slot.bucket,
    signedUrl: slot.signedUrl,
  };
}
