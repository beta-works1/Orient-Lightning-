"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Product } from "@/lib/types";
import { useCompare } from "./CompareProvider";
import { DURATION_PRESS, EASE_HOVER, LAYER_HOVER_SCALE, LAYER_PRESS_SCALE } from "@/lib/motion";

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
  const reduce = useReducedMotion();

  const base =
    variant === "pdp"
      ? `inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition ${
          selected
            ? "border-brand bg-brand text-white"
            : "border-brand-border text-brand-navy hover:border-brand hover:text-brand"
        }`
      : `absolute right-2 top-2 z-10 inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-md border bg-white/95 px-2 text-[10px] font-semibold uppercase tracking-wide shadow-sm transition ${
          selected
            ? "border-brand text-brand"
            : "border-brand-border text-brand-navy hover:border-brand hover:text-brand"
        }`;

  if (variant === "pdp") {
    return (
      <motion.button
        type="button"
        onClick={() => toggle(toItem(product))}
        className={base}
        aria-pressed={selected}
        whileTap={reduce ? undefined : { scale: LAYER_PRESS_SCALE }}
        whileHover={reduce ? undefined : { scale: LAYER_HOVER_SCALE }}
        transition={{ duration: DURATION_PRESS, ease: EASE_HOVER }}
      >
        <CompareIcon filled={selected} />
        {selected ? "Added to compare" : "Add to compare"}
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(toItem(product));
      }}
      className={base}
      aria-pressed={selected}
      aria-label={selected ? "Remove from compare" : "Add to compare"}
      whileTap={reduce ? undefined : { scale: LAYER_PRESS_SCALE }}
      whileHover={reduce ? undefined : { scale: 1.04 }}
      transition={{ duration: DURATION_PRESS, ease: EASE_HOVER }}
    >
      {selected ? "Comparing" : "Compare"}
    </motion.button>
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
