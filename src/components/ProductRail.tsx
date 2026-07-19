import Link from "next/link";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function ProductRail({
  title,
  products,
  href,
}: {
  title: string;
  products: Product[];
  href?: string;
}) {
  if (!products.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="type-display text-[1.65rem] text-brand-navy sm:text-3xl">{title}</h2>
        {href ? (
          <Link
            href={href}
            className="inline-flex min-h-[44px] cursor-pointer items-center text-sm font-medium text-brand hover:underline"
          >
            View all
          </Link>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
