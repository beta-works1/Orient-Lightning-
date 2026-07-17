"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { DownloadCatalogue } from "@/components/DownloadCatalogue";
import { BulbCalculator } from "@/components/BulbCalculator";

export function ProductPurchase({ product }: { product: Product }) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id);
  const variant = useMemo(
    () => product.variants.find((v) => v.id === variantId) || product.variants[0],
    [product.variants, variantId],
  );

  const price = variant?.price ?? product.price;
  const compare = variant?.compareAtPrice ?? product.compareAtPrice;
  const onSale = compare != null && compare > price;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-brand-navy">{product.title}</h1>
        {product.sku || variant?.sku ? (
          <p className="mt-1 text-xs text-brand-muted">SKU: {variant?.sku || product.sku}</p>
        ) : null}
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold text-brand">{formatPrice(price)}</span>
        {onSale ? (
          <span className="text-sm text-brand-muted line-through">{formatPrice(compare!)}</span>
        ) : null}
      </div>

      {product.variants.length > 1 ? (
        <div>
          <label className="text-sm font-medium text-brand-navy">Options</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  variantId === v.id
                    ? "border-brand bg-brand text-white"
                    : "border-brand-border hover:border-brand"
                }`}
              >
                {v.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <CompareToggle product={product} variant="pdp" />
        <DownloadCatalogue variant="pdp" />
      </div>

      <BulbCalculator product={product} variant={variant} />
    </div>
  );
}
