"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { CompareToggle } from "@/components/compare/CompareToggle";

const EASE = [0.22, 1, 0.36, 1] as const;

export function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const reduce = useReducedMotion();
  const image = product.images[0];
  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.price;
  const watt = product.facets?.wattage?.[0];
  const cct = product.facets?.colorTemp?.[0];

  return (
    <motion.article
      className="product-card-bloom group relative flex h-full flex-col overflow-visible rounded-2xl border border-brand-border bg-white shadow-sm transition-shadow duration-150 hover:shadow-bloom"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.25,
        delay: reduce ? 0 : Math.min(index * 0.05, 0.25),
        ease: EASE,
      }}
      whileHover={
        reduce
          ? undefined
          : {
              y: -4,
              transition: { duration: 0.15, ease: "easeOut" },
            }
      }
    >
      <div className="relative z-[1] overflow-hidden rounded-t-2xl">
        <Link
          href={`/products/${product.handle}`}
          className="relative block aspect-square cursor-pointer bg-brand-ice/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {image ? (
            <Image
              src={image}
              alt={product.title}
              fill
              sizes="(max-width:768px) 50vw, 25vw"
              className="object-contain p-3"
            />
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
