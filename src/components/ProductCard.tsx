import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { CompareToggle } from "@/components/compare/CompareToggle";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.price;
  const watt = product.facets?.wattage?.[0];
  const cct = product.facets?.colorTemp?.[0];

  return (
    <article className="product-card-bloom group relative flex h-full flex-col overflow-visible rounded-2xl border border-brand-border bg-white transition hover:shadow-bloom">
      <div className="relative z-[1] overflow-hidden rounded-t-2xl">
        <Link href={`/products/${product.handle}`} className="relative block aspect-square bg-brand-ice/40">
          {image ? (
            <Image
              src={image}
              alt={product.title}
              fill
              sizes="(max-width:768px) 50vw, 25vw"
              className="object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
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
      <div className="relative z-[1] flex flex-1 flex-col gap-2 p-4">
        <Link
          href={`/products/${product.handle}`}
          className="line-clamp-2 text-sm font-medium text-brand-charcoal hover:text-brand"
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
