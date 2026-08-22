"use client";

import { useActionState, useState, type FormEvent } from "react";
import {
  publishUploadedCatalogue,
  removeCatalogue,
  type CatalogueFormState,
} from "@/app/admin/actions";
import { InlineSpinner } from "@/components/admin/AnimatedLoader";
import type { CatalogueSetting } from "@/lib/catalogueSettings";
import { uploadAdminFile } from "@/lib/upload/browser";

const empty: CatalogueFormState = {};

export function CatalogueAdminForm({ current }: { current: CatalogueSetting }) {
  const [removeState, removeAction, removing] = useActionState(removeCatalogue, empty);
  const [fileName, setFileName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadOk, setUploadOk] = useState(false);

  const active = current.enabled && !!current.url;

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("file");
    const file =
      input instanceof HTMLInputElement && input.files?.[0] ? input.files[0] : null;
    if (!file) {
      setUploadError("Choose a PDF file.");
      setUploadOk(false);
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadOk(false);
    try {
      const uploaded = await uploadAdminFile({
        purpose: "catalogue",
        file,
        folder: "current",
      });
      if (!uploaded.ok) {
        setUploadError(uploaded.error);
        return;
      }
      const published = await publishUploadedCatalogue({
        url: uploaded.url,
        filename: uploaded.filename,
        storagePath: uploaded.path,
      });
      if (published.error) {
        setUploadError(published.error);
        return;
      }
      setUploadOk(true);
      setFileName("");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/40 bg-white/95 p-5 shadow-xl shadow-black/10 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-slate-900">Current catalogue</h2>
        {active ? (
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span className="text-emerald-700">Available on site</span>
            </p>
            <p>
              <span className="font-medium">File:</span> {current.filename}
            </p>
            <p className="break-all text-xs text-slate-500">{current.url}</p>
            <a
              href={current.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-sm font-medium text-[#0F428F] hover:underline"
            >
              Open / download current file
            </a>
          </div>
        ) : (
          <p className="mt-3 text-sm text-amber-800">
            No catalogue is published. The “Download Catalogue” button is hidden on the storefront.
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => void onUpload(e)}
        className="space-y-4 rounded-xl border border-white/40 bg-white/95 p-5 shadow-xl shadow-black/10 backdrop-blur-sm"
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Upload / replace</h2>
          <p className="mt-1 text-xs text-slate-500">
            PDF only, max 25MB. Replaces the file linked from every Download Catalogue button.
          </p>
        </div>

        {(uploadError || removeState.error) && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {uploadError || removeState.error}
          </p>
        )}
        {uploadOk ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Catalogue updated.
          </p>
        ) : null}
        {removeState.ok ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Catalogue removed from the site.
          </p>
        ) : null}

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">PDF file</span>
          <input
            type="file"
            name="file"
            accept="application/pdf,.pdf"
            required
            onChange={(e) => {
              setFileName(e.target.files?.[0]?.name || "");
              setUploadOk(false);
              setUploadError(null);
            }}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#0F428F] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#162950]"
          />
          {fileName ? <span className="mt-1 block text-xs text-slate-500">{fileName}</span> : null}
        </label>

        <button
          type="submit"
          disabled={uploading || removing}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-[#0F428F] px-4 text-sm font-semibold text-white hover:bg-[#162950] disabled:opacity-60"
        >
          {uploading ? (
            <>
              <InlineSpinner className="text-white" />
              Uploading…
            </>
          ) : (
            "Upload catalogue"
          )}
        </button>
      </form>

      {active ? (
        <form
          action={removeAction}
          className="rounded-xl border border-red-200/80 bg-white/95 p-5 shadow-xl shadow-black/10 backdrop-blur-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">Remove catalogue</h2>
          <p className="mt-1 text-xs text-slate-500">
            Hides Download Catalogue across the site. You can upload a new PDF anytime.
          </p>
          <button
            type="submit"
            disabled={uploading || removing}
            className="mt-4 flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {removing ? (
              <>
                <InlineSpinner className="text-red-700" />
                Removing…
              </>
            ) : (
              "Remove catalogue"
            )}
          </button>
        </form>
      ) : null}
    </div>
  );
}
