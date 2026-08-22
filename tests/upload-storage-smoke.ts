/**
 * Proof that the admin client upload path works without posting bytes through Next.js.
 *
 * Admin UI: inspectBrowserFile → prepareStorageUpload → PUT signedUrl → public GET
 * prepareStorageUpload = requireAdmin() + createSignedUploadSlot()
 * There is no admin password in env, so this script does not invent one and does not
 * call prepareStorageUpload (needs Next cookies). It calls createSignedUploadSlot —
 * the same function the action uses after auth — then PUT + unauthenticated GET.
 *
 * Also proves product-images stay readable after drizzle/0005 dropped listing SELECT:
 * public=true + GET /storage/v1/object/public/... → 200 with no Authorization header.
 *
 * Usage: npx tsx --env-file=.env.local tests/upload-storage-smoke.ts
 */
import { createSignedUploadSlot, removeStorageObject } from "../src/lib/upload/storage";
import { inspectBytes, isUploadErr } from "../src/lib/upload/validate";

const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082",
  "hex",
);

const JPEG = Buffer.from("ffd8ffe000104a46494600010100000100010000ffd9", "hex");

async function putAndGet(label: string, bytes: Buffer, fileName: string) {
  const inspected = inspectBytes(bytes, "product-image", fileName);
  if (isUploadErr(inspected)) throw new Error(`${label} inspect: ${inspected.error}`);

  const slot = await createSignedUploadSlot({
    purpose: "product-image",
    fileName: inspected.filename,
    size: inspected.size,
    contentType: inspected.contentType,
    folder: "uploads",
  });
  if (!slot.ok) throw new Error(`${label} createSignedUploadSlot: ${slot.error} [${slot.code}]`);

  const put = await fetch(slot.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": inspected.contentType },
    body: new Uint8Array(bytes),
  });
  const putBody = await put.text();
  if (!put.ok) {
    throw new Error(`${label} PUT ${put.status}: ${putBody.slice(0, 200)}`);
  }

  const get = await fetch(slot.url, { headers: { Accept: "*/*" } });
  if (!get.ok) {
    throw new Error(
      `${label} unauthenticated GET ${get.status} (no Authorization). url=${slot.url}`,
    );
  }
  const got = Buffer.from(await get.arrayBuffer());
  if (got.byteLength === 0) throw new Error(`${label} GET empty body`);

  console.log(
    `PASS ${label} slot+PUT ${put.status} public GET ${get.status} type=${get.headers.get("content-type")} bytes=${got.byteLength} path=${slot.path}`,
  );

  await removeStorageObject("product-image", slot.path);
  return { path: slot.path, getStatus: get.status, putStatus: put.status };
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  console.log(
    "NOTE prepareStorageUpload requires an admin cookie session; ADMIN password is not in env. Proving createSignedUploadSlot (post-auth body of that action).",
  );

  const png = await putAndGet("PNG", PNG, "qa-agent1.png");
  const jpeg = await putAndGet("JPEG", JPEG, "qa-agent1.jpg");

  console.log(
    "PASS signed-slot proof (PNG+JPEG). product-images has no SELECT policy after 0005; public GET still 200.",
    { png: png.getStatus, jpeg: jpeg.getStatus },
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
