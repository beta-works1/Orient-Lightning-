import { createServiceClient } from "@/lib/supabase/admin";
import { mimeForKind, type DetectedFileKind } from "@/lib/fileMagic";
import {
  UPLOAD_PURPOSES,
  type StorageUploadPurpose,
  type UploadErr,
  type UploadOk,
} from "@/lib/upload/types";
import { inspectBytes } from "@/lib/upload/validate";

function sanitizeFolder(folder: string | undefined, fallback: string): string {
  const cleaned = (folder || fallback)
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, "-"))
    .filter((part) => part && part !== ".." && part !== ".")
    .join("/");
  return cleaned || fallback;
}

export function sanitizeUploadFilename(raw: string, ext: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-") || "upload";
  const lower = cleaned.toLowerCase();
  return lower.endsWith(`.${ext}`) ? cleaned : `${cleaned.replace(/\.[^.]+$/, "")}.${ext}`;
}

export function objectPath(purpose: StorageUploadPurpose, folder: string | undefined, filename: string): string {
  const spec = UPLOAD_PURPOSES[purpose];
  const prefix = sanitizeFolder(folder, spec.defaultFolder);
  return `${prefix}/${Date.now()}-${crypto.randomUUID()}-${filename}`;
}

function extFromPurposeFilename(purpose: StorageUploadPurpose, fileName: string): string {
  const spec = UPLOAD_PURPOSES[purpose];
  const fromName = fileName.split(".").pop()?.toLowerCase();
  if (purpose === "catalogue") return "pdf";
  if (fromName === "jpg" || fromName === "jpeg") return "jpg";
  if (fromName && ["png", "webp", "gif", "avif"].includes(fromName)) return fromName;
  return spec.kinds[0] === "pdf" ? "pdf" : "jpg";
}

export async function createSignedUploadSlot(input: {
  purpose: StorageUploadPurpose;
  fileName: string;
  size: number;
  contentType?: string;
  folder?: string;
}): Promise<(UploadOk & { signedUrl: string; token: string }) | UploadErr> {
  const spec = UPLOAD_PURPOSES[input.purpose];
  if (!input.fileName?.trim()) {
    return { ok: false, error: spec.emptyError, code: "empty" };
  }
  if (!Number.isFinite(input.size) || input.size <= 0) {
    return { ok: false, error: spec.emptyError, code: "empty" };
  }
  if (input.size > spec.maxBytes) {
    return { ok: false, error: spec.sizeError, code: "too_large" };
  }

  const ext = extFromPurposeFilename(input.purpose, input.fileName);
  const filename = sanitizeUploadFilename(input.fileName, ext);
  const path = objectPath(input.purpose, input.folder, filename);
  const contentType =
    input.contentType && input.contentType.length < 80
      ? input.contentType
      : spec.kinds[0] === "pdf"
        ? mimeForKind("pdf")
        : mimeForKind((ext === "jpg" ? "jpeg" : ext) as Exclude<DetectedFileKind, null | "pdf">);

  try {
    const sb = createServiceClient();
    const { data, error } = await sb.storage.from(spec.bucket).createSignedUploadUrl(path, {
      upsert: false,
    });
    if (error || !data) {
      return { ok: false, error: error?.message || "Could not create upload URL.", code: "storage" };
    }
    const { data: pub } = sb.storage.from(spec.bucket).getPublicUrl(data.path);
    return {
      ok: true,
      url: pub.publicUrl,
      path: data.path,
      filename,
      contentType,
      bucket: spec.bucket,
      signedUrl: data.signedUrl,
      token: data.token,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not create upload URL.";
    if (/Missing NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE/i.test(message)) {
      return { ok: false, error: "Storage is not configured on the server (missing Supabase env).", code: "config" };
    }
    return { ok: false, error: message, code: "storage" };
  }
}

/** Server-side buffer upload (tests, scripts). Prefer signed URLs in the browser. */
export async function uploadBytesToBucket(input: {
  purpose: StorageUploadPurpose;
  bytes: Uint8Array;
  fileName: string;
  folder?: string;
  upsert?: boolean;
}): Promise<UploadOk | UploadErr> {
  const inspected = inspectBytes(input.bytes, input.purpose, input.fileName);
  if (!inspected.ok) return inspected;

  const spec = UPLOAD_PURPOSES[input.purpose];
  const path = objectPath(input.purpose, input.folder, inspected.filename);

  try {
    const sb = createServiceClient();
    const { error } = await sb.storage.from(spec.bucket).upload(path, inspected.bytes, {
      contentType: inspected.contentType,
      upsert: input.upsert ?? false,
    });
    if (error) return { ok: false, error: `Upload failed: ${error.message}`, code: "storage" };
    const { data } = sb.storage.from(spec.bucket).getPublicUrl(path);
    return {
      ok: true,
      url: data.publicUrl,
      path,
      filename: inspected.filename,
      contentType: inspected.contentType,
      bucket: spec.bucket,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed.";
    if (/Missing NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE/i.test(message)) {
      return { ok: false, error: "Storage is not configured on the server (missing Supabase env).", code: "config" };
    }
    return { ok: false, error: message, code: "storage" };
  }
}

export async function removeStorageObject(
  purpose: StorageUploadPurpose,
  storagePath: string | null | undefined,
): Promise<void> {
  if (!storagePath) return;
  const spec = UPLOAD_PURPOSES[purpose];
  const sb = createServiceClient();
  const { error } = await sb.storage.from(spec.bucket).remove([storagePath]);
  if (error) {
    console.error(`[upload] remove ${spec.bucket}/${storagePath} failed:`, error.message);
  }
}
