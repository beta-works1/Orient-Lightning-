import { detectFileKind, extForKind, mimeForKind } from "@/lib/fileMagic";
import {
  UPLOAD_PURPOSES,
  type InspectedFile,
  type StorageUploadPurpose,
  type UploadErr,
} from "@/lib/upload/types";

export function isUploadErr(res: InspectedFile | UploadErr): res is UploadErr {
  return res.ok === false;
}

export function inspectBytes(
  bytes: Uint8Array,
  purpose: StorageUploadPurpose,
  fileName = "upload",
): InspectedFile | UploadErr {
  const spec = UPLOAD_PURPOSES[purpose];
  if (bytes.byteLength === 0) {
    return { ok: false, error: spec.emptyError, code: "empty" };
  }
  if (bytes.byteLength > spec.maxBytes) {
    return { ok: false, error: spec.sizeError, code: "too_large" };
  }

  const kind = detectFileKind(bytes);
  if (!kind || !(spec.kinds as readonly string[]).includes(kind)) {
    return { ok: false, error: spec.typeError, code: "bad_type" };
  }

  const ext = extForKind(kind);
  const contentType = mimeForKind(kind);
  const safeBase = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-") || "upload";
  const filename = safeBase.toLowerCase().endsWith(`.${ext}`)
    ? safeBase
    : `${safeBase.replace(/\.[^.]+$/, "")}.${ext}`;

  return {
    ok: true,
    bytes,
    size: bytes.byteLength,
    filename,
    kind,
    contentType,
    ext,
  };
}

export async function inspectBrowserFile(
  file: { size: number; name?: string; arrayBuffer: () => Promise<ArrayBuffer> },
  purpose: StorageUploadPurpose,
): Promise<InspectedFile | UploadErr> {
  const spec = UPLOAD_PURPOSES[purpose];
  if (!file || file.size === 0) {
    return { ok: false, error: spec.emptyError, code: "empty" };
  }
  if (file.size > spec.maxBytes) {
    return { ok: false, error: spec.sizeError, code: "too_large" };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  return inspectBytes(bytes, purpose, typeof file.name === "string" ? file.name : "upload");
}

export function messageFromThrown(error: unknown): { error: string; code: UploadErr["code"] } {
  const raw = error instanceof Error ? error.message : String(error || "Upload failed");
  if (/unauthorized/i.test(raw)) {
    return { error: "Session expired. Sign in again and retry.", code: "auth" };
  }
  if (/body exceeded|413|entity too large/i.test(raw)) {
    return {
      error: "File is too large to send through the site. Use a file under the limit, or retry — uploads go directly to storage.",
      code: "too_large",
    };
  }
  if (/failed to fetch|network|load failed/i.test(raw)) {
    return { error: "Network error while uploading. Check your connection and try again.", code: "network" };
  }
  if (/Missing NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE/i.test(raw)) {
    return { error: "Storage is not configured on the server (missing Supabase env).", code: "config" };
  }
  return { error: raw.slice(0, 280) || "Upload failed.", code: "storage" };
}

/** Keep Storage/HTTP error text — never a generic "try again". */
export function formatStorageHttpError(status: number, body: string): string {
  const hint = body.replace(/\s+/g, " ").trim().slice(0, 200);
  return hint ? `Upload failed (${status}): ${hint}` : `Upload failed (${status}).`;
}
