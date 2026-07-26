/** Detect image/PDF type from magic bytes (not client MIME / extension). */

export type DetectedFileKind = "jpeg" | "png" | "webp" | "gif" | "avif" | "pdf" | null;

export function detectFileKind(buffer: Buffer): DetectedFileKind {
  if (buffer.length < 4) return null;

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";

  // PNG
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }

  // GIF
  if (buffer.length >= 6) {
    const gif = buffer.subarray(0, 6).toString("ascii");
    if (gif === "GIF87a" || gif === "GIF89a") return "gif";
  }

  // WEBP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }

  // AVIF / HEIF: ftyp....avif / avis
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (brand === "avif" || brand === "avis" || brand === "mif1") return "avif";
  }

  // PDF
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-") return "pdf";

  return null;
}

export function mimeForKind(kind: Exclude<DetectedFileKind, null | "pdf">): string {
  const map = {
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    avif: "image/avif",
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
