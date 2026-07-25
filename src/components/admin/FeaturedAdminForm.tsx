"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import { saveFeaturedWeek, type FeaturedFormState } from "@/app/admin/actions";
import { InlineSpinner } from "@/components/admin/AnimatedLoader";
import type { FeaturedSetting } from "@/lib/featuredSettings";
import { formatPrice } from "@/lib/format";

type ProductOption = {
  handle: string;
  title: string;
  price: number;
  image: string | null;
};

const empty: FeaturedFormState = {};

export function FeaturedAdminForm({
  current,
  products,
}: {
  current: FeaturedSetting;
  products: ProductOption[];
}) {
  const [selected, setSelected] = useState<string[]>(current.handles);
  const [query, setQuery] = useState("");
  const [state, action, pending] = useActionState(saveFeaturedWeek, empty);

  const byHandle = useMemo(
    () => new Map(products.map((p) => [p.handle, p])),
    [products],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.title.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q),
    );
  }, [products, query]);

  function toggle(handle: string) {
    setSelected((prev) => {
      if (prev.includes(handle)) return prev.filter((h) => h !== handle);
      if (prev.length >= 12) return prev;
      return [...prev, handle];
    });
  }

  function move(handle: string, dir: -1 | 1) {
    setSelected((prev) => {
      const i = prev.indexOf(handle);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <form action={action} className="space-y-6">
      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Featured section saved. Homepage will update shortly.
        </p>
      ) : null}

      <div className="rounded-xl border border-white/40 bg-white/95 p-5 shadow-xl shadow-black/10 backdrop-blur-sm space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Section settings</h2>
          <p className="mt-1 text-xs text-slate-500">
            Controls the homepage “Featured this week” rail. Leave product list empty to fall back to
            Best Sellers.
          </p>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Section title</span>
          <input
            name="title"
            defaultValue={current.title}
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0F428F]"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">“View all” link</span>
          <input
            name="viewAllHref"
            defaultValue={current.viewAllHref}
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0F428F]"
            placeholder="/collections/best-sellers"
          />
        </label>
      </div>

      <div className="rounded-xl border border-white/40 bg-white/95 p-5 shadow-xl shadow-black/10 backdrop-blur-sm space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Selected products</h2>
            <p className="mt-1 text-xs text-slate-500">
              {selected.length}/12 selected · drag order with Up/Down
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelected([])}
            className="text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Clear all
          </button>
        </div>

        {selected.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
            No products selected — homepage will use Best Sellers automatically.
          </p>
        ) : (
          <ul className="space-y-2">
            {selected.map((handle, index) => {
              const p = byHandle.get(handle);
              return (
                <li
                  key={handle}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2"
                >
                  <input type="hidden" name="handles" value={handle} />
                  <span className="w-6 text-xs font-semibold text-slate-400">{index + 1}</span>
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-white">
                    {p?.image ? (
                      <Image src={p.image} alt="" fill className="object-contain p-0.5" sizes="40px" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {p?.title || handle}
                    </p>
                    <p className="text-xs text-slate-500">
                      {p ? formatPrice(p.price) : "Missing / unpublished"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => move(handle, -1)}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => move(handle, 1)}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(handle)}
                      className="rounded border border-red-200 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-white/40 bg-white/95 p-5 shadow-xl shadow-black/10 backdrop-blur-sm space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Add from catalog</h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="mt-3 w-full max-w-md rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0F428F]"
          />
        </div>
        <ul className="max-h-96 space-y-2 overflow-y-auto">
          {filtered.map((p) => {
            const on = selected.includes(p.handle);
            return (
              <li key={p.handle}>
                <button
                  type="button"
                  onClick={() => toggle(p.handle)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                    on
                      ? "border-[#0F428F] bg-[#0F428F]/5"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-100">
                    {p.image ? (
                      <Image src={p.image} alt="" fill className="object-contain p-0.5" sizes="40px" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{p.title}</p>
                    <p className="text-xs text-slate-500">
                      {p.handle} · {formatPrice(p.price)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#0F428F]">{on ? "Selected" : "Add"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-[#0F428F] px-4 text-sm font-semibold text-white hover:bg-[#162950] disabled:opacity-60"
      >
        {pending ? (
          <>
            <InlineSpinner className="text-white" />
            Saving…
          </>
        ) : (
          "Save featured section"
        )}
      </button>
    </form>
  );
}
