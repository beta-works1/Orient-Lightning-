"use client";

import { useActionState, useState } from "react";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
  type ProductFormState,
} from "@/app/admin/actions";

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
    sku: string;
    productType: string;
    vendor: string;
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
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-900";

export function ProductForm({ mode, productId, collections, initial }: Props) {
  const action =
    mode === "create"
      ? createProduct
      : (prev: ProductFormState, fd: FormData) => updateProduct(productId!, prev, fd);

  const [state, formAction, pending] = useActionState(action, empty);
  const [images, setImages] = useState((initial?.images || []).join("\n"));
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadProductImage(fd);
    setUploading(false);
    if (res.error || !res.url) {
      setUploadError(res.error || "Upload failed");
      return;
    }
    setImages((prev) => (prev.trim() ? `${prev.trim()}\n${res.url}` : res.url!));
  }

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
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
        <span className="mb-1 block font-medium text-slate-700">Handle (URL slug)</span>
        <input
          name="handle"
          defaultValue={initial?.handle}
          className={inputClass}
          placeholder="auto from title if empty"
        />
        {state.fieldErrors?.handle ? (
          <span className="mt-1 block text-xs text-red-600">{state.fieldErrors.handle}</span>
        ) : null}
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Description (HTML ok)</span>
        <textarea name="description" rows={6} defaultValue={initial?.description} className={inputClass} />
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
          <span className="mb-1 block font-medium text-slate-700">Compare-at price</span>
          <input
            name="compareAtPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initial?.compareAtPrice ?? ""}
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">SKU</span>
          <input name="sku" defaultValue={initial?.sku} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Type</span>
          <input
            name="productType"
            defaultValue={initial?.productType}
            className={inputClass}
            placeholder="Street Light"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Vendor</span>
        <input name="vendor" defaultValue={initial?.vendor || "Orient"} className={inputClass} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Wattage (comma-separated)</span>
          <input name="wattage" defaultValue={initial?.wattage} className={inputClass} placeholder="12, 18" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Color temp (comma-separated)</span>
          <input
            name="colorTemp"
            defaultValue={initial?.colorTemp}
            className={inputClass}
            placeholder="3000, 6500"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Options (comma-separated)</span>
        <input name="options" defaultValue={initial?.options} className={inputClass} />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Images (one URL per line)</span>
        <textarea
          name="images"
          rows={4}
          value={images}
          onChange={(e) => setImages(e.target.value)}
          className={`${inputClass} font-mono text-xs`}
        />
      </label>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Upload image to Supabase Storage
        </label>
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => onUpload(e.target.files?.[0] || null)}
          className="block w-full text-sm"
        />
        {uploading ? <p className="mt-1 text-xs text-slate-500">Uploading…</p> : null}
        {uploadError ? <p className="mt-1 text-xs text-red-600">{uploadError}</p> : null}
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
        disabled={pending}
        className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-blue-900 px-4 text-sm font-semibold text-white hover:bg-blue-950 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
      </button>
    </form>
  );
}
