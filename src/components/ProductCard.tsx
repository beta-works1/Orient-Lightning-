import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.price;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-brand-border bg-white transition hover:shadow-md">
      <Link href={`/products/${product.handle}`} className="relative block aspect-square bg-slate-50">
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            className="object-contain p-3 transition group-hover:scale-[1.02]"
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
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/products/${product.handle}`} className="line-clamp-2 text-sm font-medium text-brand-dark hover:text-brand">
          {product.title}
        </Link>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="font-semibold text-brand">{formatPrice(product.price)}</span>
          {onSale ? (
            <span className="text-xs text-brand-muted line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
