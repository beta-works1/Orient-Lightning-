import type { DetectedFileKind } from "@/lib/fileMagic";

export type StorageUploadPurpose = "product-image" | "catalogue";

export type UploadErrorCode =
  | "empty"
  | "too_large"
  | "bad_type"
  | "auth"
  | "network"
  | "storage"
  | "config";

export type UploadOk = {
  ok: true;
  url: string;
  path: string;
  filename: string;
  contentType: string;
  bucket: string;
};

export type UploadErr = {
  ok: false;
  error: string;
  code: UploadErrorCode;
};

export type UploadResult = UploadOk | UploadErr;

export type InspectedFile = {
  ok: true;
  bytes: Uint8Array;
  size: number;
  filename: string;
  kind: Exclude<DetectedFileKind, null>;
  contentType: string;
  ext: string;
};

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PDF_MAX_BYTES = 25 * 1024 * 1024;

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const CATALOGUES_BUCKET = "catalogues";

export const UPLOAD_PURPOSES = {
  "product-image": {
    bucket: PRODUCT_IMAGES_BUCKET,
    maxBytes: IMAGE_MAX_BYTES,
    kinds: ["jpeg", "png", "webp", "gif", "avif"] as const,
    defaultFolder: "uploads",
    emptyError: "Choose an image file.",
    typeError: "Only JPG, PNG, WebP, GIF, or AVIF images are allowed.",
    sizeError: "Image must be under 5MB.",
  },
  catalogue: {
    bucket: CATALOGUES_BUCKET,
    maxBytes: PDF_MAX_BYTES,
    kinds: ["pdf"] as const,
    defaultFolder: "current",
    emptyError: "Choose a PDF file.",
    typeError: "Only PDF catalogues are allowed.",
    sizeError: "PDF must be under 25MB.",
  },
} as const;
