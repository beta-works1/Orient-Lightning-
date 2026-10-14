import assert from "node:assert/strict";
import { test } from "node:test";
import { detectFileKind, extForKind, mimeForKind } from "../src/lib/fileMagic";
import { isBlobLike, readFormFile } from "../src/lib/upload/formFile";
import { IMAGE_MAX_BYTES, PDF_MAX_BYTES, type UploadErrorCode } from "../src/lib/upload/types";
import { inspectBytes, isUploadErr, messageFromThrown } from "../src/lib/upload/validate";
import type { InspectedFile } from "../src/lib/upload/types";
import type { UploadErr } from "../src/lib/upload/types";

const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082",
  "hex",
);

const JPEG = Buffer.from("ffd8ffe000104a46494600010100000100010000ffd9", "hex");

const WEBP = Buffer.concat([
  Buffer.from("RIFF"),
  Buffer.from([0x0c, 0x00, 0x00, 0x00]),
  Buffer.from("WEBP"),
  Buffer.from("VP8L"),
]);

const PDF = Buffer.from("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");

function expectErr(res: InspectedFile | UploadErr, code: UploadErrorCode): asserts res is UploadErr {
  if (!isUploadErr(res)) {
    throw new Error("expected UploadErr");
  }
  assert.equal(res.code, code);
}

function expectOk(res: InspectedFile | UploadErr): asserts res is InspectedFile {
  if (isUploadErr(res)) {
    throw new Error(res.error);
  }
}

test("detectFileKind: png jpeg webp pdf and garbage", () => {
  assert.equal(detectFileKind(PNG), "png");
  assert.equal(detectFileKind(JPEG), "jpeg");
  assert.equal(detectFileKind(WEBP), "webp");
  assert.equal(detectFileKind(PDF), "pdf");
  assert.equal(detectFileKind(Buffer.from("not-a-file")), null);
  assert.equal(detectFileKind(new Uint8Array(0)), null);
});

test("inspectBytes: empty / too large / wrong type / success", () => {
  expectErr(inspectBytes(new Uint8Array(0), "product-image"), "empty");

  const huge = new Uint8Array(IMAGE_MAX_BYTES + 1);
  huge.set(PNG.subarray(0, 8));
  expectErr(inspectBytes(huge, "product-image"), "too_large");

  expectErr(inspectBytes(PDF, "product-image"), "bad_type");

  const pngRes = inspectBytes(PNG, "product-image", "lamp.PNG");
  expectOk(pngRes);
  assert.equal(pngRes.kind, "png");
  assert.equal(pngRes.contentType, "image/png");
  assert.equal(pngRes.ext, "png");

  expectOk(inspectBytes(JPEG, "product-image", "photo.jpg"));
  expectOk(inspectBytes(WEBP, "product-image"));

  const pdfOk = inspectBytes(PDF, "catalogue", "Orient Catalogue.pdf");
  expectOk(pdfOk);
  assert.equal(pdfOk.contentType, "application/pdf");

  const hugePdf = new Uint8Array(PDF_MAX_BYTES + 1);
  hugePdf.set(PDF.subarray(0, 8));
  expectErr(inspectBytes(hugePdf, "catalogue"), "too_large");
});

test("readFormFile duck-types Blob/File and rejects strings", async () => {
  const missing = new FormData();
  missing.set("file", "https://example.com/x.png");
  const asString = await readFormFile(missing);
  assert.equal(asString.ok, false);

  const empty = new FormData();
  empty.set("file", new File([], "empty.png", { type: "image/png" }));
  const asEmpty = await readFormFile(empty);
  assert.equal(asEmpty.ok, false);

  const ok = new FormData();
  ok.set("file", new File([PNG], "lamp.png", { type: "application/octet-stream" }));
  const asFile = await readFormFile(ok);
  assert.equal(asFile.ok, true);
  if (asFile.ok) {
    assert.equal(isBlobLike(asFile.blob), true);
    assert.equal(detectFileKind(asFile.bytes), "png");
  }
});

test("messageFromThrown maps auth and 413", () => {
  assert.equal(messageFromThrown(new Error("Unauthorized")).code, "auth");
  assert.equal(
    messageFromThrown(new Error("Unauthorized: admin_users allowlist entry is missing")).error,
    "This account is not enabled for admin access. Contact the site owner.",
  );
  assert.equal(messageFromThrown(new Error("Body exceeded 1 MB limit.")).code, "too_large");
  assert.equal(messageFromThrown(new Error("Failed to fetch")).code, "network");
});

test("ext/mime helpers", () => {
  assert.equal(extForKind("jpeg"), "jpg");
  assert.equal(mimeForKind("jpeg"), "image/jpeg");
  assert.equal(mimeForKind("pdf"), "application/pdf");
});
