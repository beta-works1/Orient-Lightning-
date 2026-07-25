"use client";

import { useCallback, useState } from "react";
import type { Product, ProductVariant } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { DownloadCatalogue } from "@/components/DownloadCatalogue";
import { BulbCalculator } from "@/components/BulbCalculator";
import { ProductOptions } from "@/components/ProductOptions";

export function ProductPurchase({ product }: { product: Product }) {
  const [variant, setVariant] = useState<ProductVariant | undefined>(product.variants[0]);

  const onVariantChange = useCallback((v: ProductVariant | undefined) => {
    setVariant(v);
  }, []);

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

      <ProductOptions product={product} onVariantChange={onVariantChange} />

      <div className="flex flex-wrap gap-3">
        <CompareToggle product={product} variant="pdp" />
        <DownloadCatalogue variant="pdp" />
      </div>

      <BulbCalculator product={product} variant={variant} />
    </div>
  );
}
