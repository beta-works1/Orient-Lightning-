/**
 * Next.js Server Actions reconstruct File from undici; `instanceof File` is unreliable.
 * Duck-type Blob-like values from FormData instead.
 */

export type BlobLike = {
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
  name?: string;
  type?: string;
};

export function isBlobLike(value: unknown): value is BlobLike {
  if (!value || typeof value !== "object") return false;
  const v = value as { size?: unknown; arrayBuffer?: unknown };
  return typeof v.size === "number" && typeof v.arrayBuffer === "function";
}

export async function readFormFile(
  formData: FormData,
  key = "file",
): Promise<{ ok: true; blob: BlobLike; bytes: Uint8Array } | { ok: false; reason: "missing" | "empty" }> {
  const value = formData.get(key);
  if (typeof value === "string" || !isBlobLike(value)) {
    return { ok: false, reason: "missing" };
  }
  if (value.size === 0) return { ok: false, reason: "empty" };
  const bytes = new Uint8Array(await value.arrayBuffer());
  if (bytes.byteLength === 0) return { ok: false, reason: "empty" };
  return { ok: true, blob: value, bytes };
}

export function blobFileName(blob: BlobLike, fallback = "upload"): string {
  return typeof blob.name === "string" && blob.name.trim() ? blob.name : fallback;
}
