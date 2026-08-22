/** Detect image/PDF type from magic bytes (not client MIME / extension). */

export type DetectedFileKind = "jpeg" | "png" | "webp" | "gif" | "avif" | "pdf" | null;

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.subarray(start, end));
}

/** Accepts Node Buffer or browser Uint8Array. */
export function detectFileKind(bytes: Uint8Array): DetectedFileKind {
  if (bytes.length < 4) return null;

  // JPEG
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";

  // PNG
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }

  // GIF
  if (bytes.length >= 6) {
    const gif = ascii(bytes, 0, 6);
    if (gif === "GIF87a" || gif === "GIF89a") return "gif";
  }

  // WEBP: RIFF....WEBP
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") {
    return "webp";
  }

  // AVIF / HEIF: ftyp....avif / avis
  if (bytes.length >= 12 && ascii(bytes, 4, 8) === "ftyp") {
    const brand = ascii(bytes, 8, 12);
    if (brand === "avif" || brand === "avis" || brand === "mif1") return "avif";
  }

  // PDF
  if (bytes.length >= 5 && ascii(bytes, 0, 5) === "%PDF-") return "pdf";

  return null;
}

export function mimeForKind(kind: Exclude<DetectedFileKind, null>): string {
  const map = {
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    avif: "image/avif",
    pdf: "application/pdf",
  } as const;
  return map[kind];
}

export function extForKind(kind: Exclude<DetectedFileKind, null>): string {
  const map = {
    jpeg: "jpg",
    png: "png",
    webp: "webp",
    gif: "gif",
    avif: "avif",
    pdf: "pdf",
  } as const;
  return map[kind];
}
