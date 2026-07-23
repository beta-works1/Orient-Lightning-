"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { CompareToggle } from "@/components/compare/CompareToggle";
import {
  DURATION_HOVER,
  DURATION_REVEAL,
  EASE_HOVER,
  EASE_REVEAL,
  LAYER_HOVER_LIFT,
  VIEWPORT_ONCE,
} from "@/lib/motion";

export function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const reduce = useReducedMotion();
  const primary = product.images[0];
  const secondary = product.images[1];
  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.price;
  const watt = product.facets?.wattage?.[0];
  const cct = product.facets?.colorTemp?.[0];

  return (
    <motion.article
      className="product-card-bloom elev-card group relative flex h-full flex-col overflow-visible rounded-2xl border border-brand-border bg-white"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={VIEWPORT_ONCE}
      transition={{
        duration: DURATION_REVEAL,
        delay: reduce ? 0 : Math.min(index * 0.05, 0.25),
        ease: EASE_REVEAL,
      }}
      whileHover={
        reduce
          ? undefined
          : {
              y: LAYER_HOVER_LIFT,
              transition: { duration: DURATION_HOVER, ease: EASE_HOVER },
            }
      }
    >
      <div className="relative z-[1] overflow-hidden rounded-t-2xl">
        <Link
          href={`/products/${product.handle}`}
          className="relative block aspect-square cursor-pointer bg-brand-ice/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {primary ? (
            <>
              <Image
                src={primary}
                alt={product.title}
                fill
                sizes="(max-width:768px) 50vw, 25vw"
                quality={65}
                className={`object-contain p-3 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  secondary
                    ? "group-hover:opacity-0 group-focus-within:opacity-0"
                    : "will-change-transform group-hover:scale-[1.03] group-focus-within:scale-[1.03]"
                }`}
              />
              {secondary ? (
                <Image
                  src={secondary}
                  alt=""
                  fill
                  sizes="(max-width:768px) 50vw, 25vw"
                  quality={65}
                  loading="lazy"
                  className="absolute inset-0 object-contain p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
                  aria-hidden
                />
              ) : null}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-brand-muted">No image</div>
          )}
          {onSale ? (
            <span className="absolute left-2 top-2 rounded bg-brand-sale px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
              Sale
            </span>
          ) : null}
        </Link>
        <CompareToggle product={product} />
      </div>
      <div className="relative z-[1] flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <Link
          href={`/products/${product.handle}`}
          className="line-clamp-2 cursor-pointer text-sm font-medium leading-snug text-brand-charcoal transition hover:text-brand"
        >
          {product.title}
        </Link>
        {(watt || cct) && (
          <p className="spec-mono text-brand-muted">
            {watt ? `${watt}W` : null}
            {watt && cct ? " · " : null}
            {cct ? `${cct}K` : null}
          </p>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-base font-semibold text-brand">{formatPrice(product.price)}</span>
          {onSale ? (
            <span className="text-xs text-brand-muted line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
