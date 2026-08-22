export {
  IMAGE_MAX_BYTES,
  PDF_MAX_BYTES,
  PRODUCT_IMAGES_BUCKET,
  CATALOGUES_BUCKET,
  UPLOAD_PURPOSES,
  type StorageUploadPurpose,
  type UploadErrorCode,
  type UploadOk,
  type UploadErr,
  type UploadResult,
} from "@/lib/upload/types";

export {
  inspectBytes,
  inspectBrowserFile,
  messageFromThrown,
  isUploadErr,
  formatStorageHttpError,
} from "@/lib/upload/validate";
export { isBlobLike, readFormFile } from "@/lib/upload/formFile";
export { uploadBytesToBucket, removeStorageObject, createSignedUploadSlot } from "@/lib/upload/storage";
// Browser PUT helper: import from "@/lib/upload/browser" in Client Components only.
