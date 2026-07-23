"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
  type ProductFormState,
} from "@/app/admin/actions";
import { InlineSpinner } from "@/components/admin/AnimatedLoader";

type CollectionOption = { handle: string; title: string };

type Props = {
  mode: "create" | "edit";
  productId?: string;
  collections: CollectionOption[];
  initial?: {
    title: string;
    handle: string;
    description: string;
    price: number;
    compareAtPrice: number | null;
    productType: string;
    status: "draft" | "published";
    wattage: string;
    colorTemp: string;
    options: string;
    images: string[];
    collectionHandles: string[];
  };
};

const empty: ProductFormState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0F428F]";

/** Show plain text in the admin editor (strip leftover HTML from old imports). */
function toPlainDescription(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function ProductForm({ mode, productId, collections, initial }: Props) {
  const action =
    mode === "create"
      ? createProduct
      : (prev: ProductFormState, fd: FormData) => updateProduct(productId!, prev, fd);

  const [state, formAction, pending] = useActionState(action, empty);
  const [imageList, setImageList] = useState<string[]>(initial?.images || []);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onUpload(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    setUploadError(null);

    const uploaded: string[] = [];
    for (const file of Array.from(fileList)) {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadProductImage(fd);
      if (res.error || !res.url) {
        setUploadError(res.error || "Upload failed");
        break;
      }
      uploaded.push(res.url);
    }

    if (uploaded.length) {
      setImageList((prev) => [...prev, ...uploaded]);
    }
    setUploading(false);
  }

  function removeImage(url: string) {
    setImageList((prev) => prev.filter((u) => u !== url));
  }

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-xl border border-white/40 bg-white/95 p-4 shadow-xl shadow-black/10 backdrop-blur-sm sm:p-6"
    >
      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Title</span>
        <input name="title" required defaultValue={initial?.title} className={inputClass} />
        {state.fieldErrors?.title ? (
          <span className="mt-1 block text-xs text-red-600">{state.fieldErrors.title}</span>
        ) : null}
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Product link</span>
        <input
          name="handle"
          defaultValue={initial?.handle}
          className={inputClass}
          placeholder="Leave blank to create from title"
        />
        <span className="mt-1 block text-xs text-slate-500">Used in the product page URL</span>
        {state.fieldErrors?.handle ? (
          <span className="mt-1 block text-xs text-red-600">{state.fieldErrors.handle}</span>
        ) : null}
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Description</span>
        <textarea
          name="description"
          rows={6}
          defaultValue={toPlainDescription(initial?.description || "")}
          className={inputClass}
          placeholder="Write a short product description…"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Price (PKR)</span>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={initial?.price ?? ""}
            className={inputClass}
          />
          {state.fieldErrors?.price ? (
            <span className="mt-1 block text-xs text-red-600">{state.fieldErrors.price}</span>
          ) : null}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Was price (optional)</span>
          <input
            name="compareAtPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initial?.compareAtPrice ?? ""}
            className={inputClass}
            placeholder="Shown crossed out when higher"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Product type</span>
        <input
          name="productType"
          defaultValue={initial?.productType}
          className={inputClass}
          placeholder="e.g. Street Light, Bulb, Panel"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Wattage</span>
          <input name="wattage" defaultValue={initial?.wattage} className={inputClass} placeholder="e.g. 12, 18" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Color temperature</span>
          <input
            name="colorTemp"
            defaultValue={initial?.colorTemp}
            className={inputClass}
            placeholder="e.g. 3000, 6500"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Options (optional)</span>
        <input
          name="options"
          defaultValue={initial?.options}
          className={inputClass}
          placeholder="e.g. Round, Square"
        />
      </label>

      <div>
        <span className="mb-2 block text-sm font-medium text-slate-700">Images</span>
        <input type="hidden" name="images" value={imageList.join("\n")} />

        {imageList.length ? (
          <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {imageList.map((url) => (
              <li
                key={url}
                className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
              >
                <div className="relative aspect-square">
                  <Image src={url} alt="" fill className="object-contain p-2" sizes="160px" />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute right-1 top-1 rounded bg-white/95 px-2 py-1 text-xs font-medium text-red-700 shadow hover:bg-red-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3 text-xs text-slate-500">No images yet.</p>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Upload image</span>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={(e) => {
              void onUpload(e.target.files);
              e.target.value = "";
            }}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#0F428F] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#162950]"
          />
        </label>
        {uploading ? (
          <p className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
            <InlineSpinner className="text-[#0F428F]" />
            Uploading…
          </p>
        ) : null}
        {uploadError ? <p className="mt-2 text-xs text-red-600">{uploadError}</p> : null}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Collections</legend>
        <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto rounded-md border border-slate-200 p-3 sm:grid-cols-2">
          {collections.map((c) => (
            <label key={c.handle} className="flex min-h-[40px] items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="collections"
                value={c.handle}
                defaultChecked={initial?.collectionHandles.includes(c.handle)}
              />
              <span>{c.title}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Status</span>
        <select name="status" defaultValue={initial?.status || "draft"} className={inputClass}>
          <option value="draft">Draft (hidden on site)</option>
          <option value="published">Published</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={pending || uploading}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-[#0F428F] px-4 text-sm font-semibold text-white hover:bg-[#162950] disabled:opacity-60 sm:w-auto"
      >
        {pending ? (
          <>
            <InlineSpinner className="text-white" />
            Saving…
          </>
        ) : mode === "create" ? (
          "Create product"
        ) : (
          "Save changes"
        )}
      </button>
    </form>
  );
}
