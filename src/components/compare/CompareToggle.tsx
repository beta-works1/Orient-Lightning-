"use client";

import type { Product } from "@/lib/types";
import { useCompare } from "./CompareProvider";

function toItem(product: Product) {
  return {
    handle: product.handle,
    title: product.title,
    image: product.images[0] ?? null,
  };
}

export function CompareToggle({
  product,
  variant = "card",
}: {
  product: Product;
  variant?: "card" | "pdp";
}) {
  const { isSelected, toggle, ready } = useCompare();
  const selected = ready && isSelected(product.handle);

  if (variant === "pdp") {
    return (
      <button
        type="button"
        onClick={() => toggle(toItem(product))}
        className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition ${
          selected
            ? "border-brand bg-brand text-white"
            : "border-brand-border text-brand-navy hover:border-brand hover:text-brand"
        }`}
        aria-pressed={selected}
      >
        <CompareIcon filled={selected} />
        {selected ? "Added to compare" : "Add to compare"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(toItem(product));
      }}
      className={`absolute right-2 top-2 z-10 inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-md border bg-white/95 px-2 text-[10px] font-semibold uppercase tracking-wide shadow-sm transition ${
        selected
          ? "border-brand text-brand"
          : "border-brand-border text-brand-navy hover:border-brand hover:text-brand"
      }`}
      aria-pressed={selected}
      aria-label={selected ? "Remove from compare" : "Add to compare"}
    >
      {selected ? "Comparing" : "Compare"}
    </button>
  );
}

function CompareIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="7" height="16" rx="1" fill={filled ? "currentColor" : "none"} opacity={filled ? 0.25 : 1} />
      <rect x="14" y="4" width="7" height="16" rx="1" fill={filled ? "currentColor" : "none"} opacity={filled ? 0.25 : 1} />
    </svg>
  );
}
