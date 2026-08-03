"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
  type ProductFormState,
} from "@/app/admin/actions";
import { InlineSpinner } from "@/components/admin/AnimatedLoader";
import { looksLikeHtml } from "@/lib/adminProductOptions";

type CollectionOption = { handle: string; title: string };

type WattPriceInitial = Record<string, { price: number; compareAtPrice: number | null }>;
type WattSizeInitial = Record<string, string>;

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
    wattagePrices?: WattPriceInitial;
    wattageSizes?: WattSizeInitial;
  };
};

const empty: ProductFormState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0F428F]";

function wattTokensFromInput(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const m = part.trim().match(/(\d+(?:\.\d+)?)/);
    if (!m) continue;
    const key = String(Number(m[1]));
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
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
  const [wattageInput, setWattageInput] = useState(initial?.wattage || "");

  const wattTokens = useMemo(() => wattTokensFromInput(wattageInput), [wattageInput]);

  const descriptionIsHtml = looksLikeHtml(initial?.description || "");

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
          rows={descriptionIsHtml ? 12 : 6}
          defaultValue={initial?.description || ""}
          className={`${inputClass} font-mono text-xs leading-relaxed`}
          placeholder="Write a product description. Plain text is fine — or paste catalogue HTML."
        />
        <span className="mt-1 block text-xs text-slate-500">
          Plain text becomes paragraphs on the site. Catalogue HTML (tables/lists) is kept and rendered.
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Default price (PKR)</span>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={initial?.price ?? ""}
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-slate-500">
            Used when a wattage has no price below. Listing shows the lowest wattage price.
          </span>
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

      <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Storefront options</p>
          <p className="mt-0.5 text-xs text-slate-500">
            These become the Wattage and Color temperature pickers (e.g. Warm light/3000K) on the
            product page.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Wattage</span>
            <input
              name="wattage"
              value={wattageInput}
              onChange={(e) => setWattageInput(e.target.value)}
              className={inputClass}
              placeholder="e.g. 100, 150, 200"
            />
            <span className="mt-1 block text-xs text-slate-500">Comma-separated watts</span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Color temperature (Kelvin)</span>
            <input
              name="colorTemp"
              defaultValue={initial?.colorTemp}
              className={inputClass}
              placeholder="e.g. 3000, 4000, 6500"
            />
            <span className="mt-1 block text-xs text-slate-500">
              3000 = Warm · 4000 = Natural · 6500 = Daylight
            </span>
          </label>
        </div>

        {wattTokens.length > 0 ? (
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-sm font-semibold text-slate-800">Price & size by wattage</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Different price and optional size/length per watt. Leave blank to skip.
              </p>
            </div>
            <div className="hidden grid-cols-[4rem_1fr_1fr_1.2fr] gap-3 border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-500 sm:grid">
              <span>Watt</span>
              <span>Price (PKR)</span>
              <span>Was price</span>
              <span>Size / length</span>
            </div>
            <div className="divide-y divide-slate-100">
              {wattTokens.map((watt) => {
                const init = initial?.wattagePrices?.[watt];
                const initSize = initial?.wattageSizes?.[watt] ?? "";
                return (
                  <div
                    key={watt}
                    className="grid grid-cols-1 gap-2 px-3 py-3 sm:grid-cols-[4rem_1fr_1fr_1.2fr] sm:items-center sm:gap-3"
                  >
                    <p className="text-sm font-semibold text-slate-800">{watt}W</p>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs font-medium text-slate-500 sm:hidden">
                        Price (PKR)
                      </span>
                      <input
                        name={`watt_price_${watt}`}
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={init?.price ?? ""}
                        className={inputClass}
                        placeholder="Default"
                      />
                      {state.fieldErrors?.[`watt_price_${watt}`] ? (
                        <span className="mt-1 block text-xs text-red-600">
                          {state.fieldErrors[`watt_price_${watt}`]}
                        </span>
                      ) : null}
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs font-medium text-slate-500 sm:hidden">
                        Was price
                      </span>
                      <input
                        name={`watt_compare_${watt}`}
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={init?.compareAtPrice ?? ""}
                        className={inputClass}
                        placeholder="Optional"
                      />
                      {state.fieldErrors?.[`watt_compare_${watt}`] ? (
                        <span className="mt-1 block text-xs text-red-600">
                          {state.fieldErrors[`watt_compare_${watt}`]}
                        </span>
                      ) : null}
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs font-medium text-slate-500 sm:hidden">
                        Size / length
                      </span>
                      <input
                        name={`watt_size_${watt}`}
                        type="text"
                        defaultValue={initSize}
                        className={inputClass}
                        placeholder="e.g. 2 ft, 600mm"
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Style / shape (optional)</span>
          <input
            name="options"
            defaultValue={initial?.options}
            className={inputClass}
            placeholder="e.g. Round, Square"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Extra style choices combined with wattage and color temperature
          </span>
        </label>
      </div>

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
