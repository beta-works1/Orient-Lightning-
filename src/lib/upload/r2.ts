import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  UPLOAD_PURPOSES,
  type StorageUploadPurpose,
  type UploadErr,
  type UploadOk,
} from "@/lib/upload/types";

export function r2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET?.trim() &&
      process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.trim(),
  );
}

function r2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID!.trim();
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
    },
  });
}

function publicBase(): string {
  return process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL!.trim().replace(/\/$/, "");
}

function bucket(): string {
  return process.env.R2_BUCKET!.trim();
}

/** Object key includes purpose prefix so product images and catalogues stay separated. */
export function r2ObjectKey(purpose: StorageUploadPurpose, path: string): string {
  const prefix = purpose === "catalogue" ? "catalogues" : "product-images";
  return `${prefix}/${path.replace(/^\/+/, "")}`;
}

export function r2PublicUrl(key: string): string {
  return `${publicBase()}/${key.replace(/^\/+/, "")}`;
}

export async function createR2SignedUploadSlot(input: {
  purpose: StorageUploadPurpose;
  path: string;
  filename: string;
  contentType: string;
}): Promise<(UploadOk & { signedUrl: string; token: string }) | UploadErr> {
  if (!r2Configured()) {
    return {
      ok: false,
      error: "Cloudflare R2 is not configured on the server (missing R2 env).",
      code: "config",
    };
  }
  const key = r2ObjectKey(input.purpose, input.path);
  try {
    const client = r2Client();
    const command = new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      ContentType: input.contentType,
    });
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 60 * 10 });
    return {
      ok: true,
      url: r2PublicUrl(key),
      path: key,
      filename: input.filename,
      contentType: input.contentType,
      bucket: bucket(),
      signedUrl,
      token: "",
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not create R2 upload URL.";
    return { ok: false, error: message.slice(0, 280), code: "storage" };
  }
}

export async function uploadBytesToR2(input: {
  purpose: StorageUploadPurpose;
  path: string;
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}): Promise<UploadOk | UploadErr> {
  if (!r2Configured()) {
    return {
      ok: false,
      error: "Cloudflare R2 is not configured on the server (missing R2 env).",
      code: "config",
    };
  }
  const key = r2ObjectKey(input.purpose, input.path);
  try {
    const client = r2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: key,
        Body: input.bytes,
        ContentType: input.contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return {
      ok: true,
      url: r2PublicUrl(key),
      path: key,
      filename: input.filename,
      contentType: input.contentType,
      bucket: bucket(),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "R2 upload failed.";
    return { ok: false, error: message.slice(0, 280), code: "storage" };
  }
}

export async function removeR2Object(
  purpose: StorageUploadPurpose,
  storagePath: string | null | undefined,
): Promise<void> {
  if (!storagePath || !r2Configured()) return;
  const key = storagePath.includes("/")
    ? storagePath.replace(/^\/+/, "")
    : r2ObjectKey(purpose, storagePath);
  try {
    const client = r2Client();
    await client.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    console.error(`[upload] remove R2 ${key} failed:`, message);
  }
}

export function r2PurposeLabel(purpose: StorageUploadPurpose): string {
  return UPLOAD_PURPOSES[purpose].bucket;
}
