"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useCompare } from "./CompareProvider";

type Row = {
  key: string;
  label: string;
  values: string[];
};

function optionLabel(product: Product): string {
  if (!product.options?.length) return "—";
  return product.options.map((o) => `${o.name}: ${o.values.join(", ")}`).join(" · ");
}

function buildRows(products: Product[]): Row[] {
  return [
    {
      key: "price",
      label: "Price",
      values: products.map((p) => formatPrice(p.price)),
    },
    {
      key: "compareAt",
      label: "Compare at",
      values: products.map((p) =>
        p.compareAtPrice != null && p.compareAtPrice > p.price
          ? formatPrice(p.compareAtPrice)
          : "—",
      ),
    },
    {
      key: "wattage",
      label: "Wattage",
      values: products.map((p) => (p.facets?.wattage?.length ? p.facets.wattage.join(", ") : "—")),
    },
    {
      key: "colorTemp",
      label: "Color temp",
      values: products.map((p) =>
        p.facets?.colorTemp?.length ? p.facets.colorTemp.join(", ") : "—",
      ),
    },
    {
      key: "options",
      label: "Options",
      values: products.map(optionLabel),
    },
    {
      key: "sku",
      label: "SKU",
      values: products.map((p) => p.sku || "—"),
    },
    {
      key: "type",
      label: "Type",
      values: products.map((p) => p.productType || "—"),
    },
    {
      key: "vendor",
      label: "Vendor",
      values: products.map((p) => p.vendor || "—"),
    },
  ];
}

function differs(values: string[]): boolean {
  const unique = new Set(values);
  return unique.size > 1;
}

export function CompareTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const { remove, setFromHandles, ready } = useCompare();

  useEffect(() => {
    if (!ready) return;
    setFromHandles(
      products.map((p) => ({
        handle: p.handle,
        title: p.title,
        image: p.images[0] ?? null,
      })),
    );
  }, [products, ready, setFromHandles]);

  const rows = buildRows(products);

  function removeProduct(handle: string) {
    remove(handle);
    const next = products.filter((p) => p.handle !== handle).map((p) => p.handle);
    if (next.length === 0) {
      router.push("/compare");
    } else {
      router.push(`/compare?products=${next.join(",")}`);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-brand-border bg-white">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-brand-border">
            <th className="w-32 bg-slate-50 p-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Spec
            </th>
            {products.map((p) => (
              <th key={p.handle} className="min-w-[180px] p-3 align-top">
                <div className="relative mx-auto mb-3 aspect-square max-w-[140px] overflow-hidden rounded-md bg-slate-50">
                  {p.images[0] ? (
                    <Image
                      src={p.images[0]}
                      alt={p.title}
                      fill
                      sizes="140px"
                      className="object-contain p-2"
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeProduct(p.handle)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-brand-muted shadow hover:text-brand-sale"
                    aria-label={`Remove ${p.title}`}
                  >
                    ×
                  </button>
                </div>
                <Link
                  href={`/products/${p.handle}`}
                  className="block font-medium text-brand-dark hover:text-brand"
                >
                  {p.title}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const highlight = differs(row.values);
            return (
              <tr key={row.key} className="border-b border-brand-border last:border-0">
                <th className="bg-slate-50 p-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  {row.label}
                </th>
                {row.values.map((value, i) => (
                  <td
                    key={`${row.key}-${products[i].handle}`}
                    className={`p-3 text-brand-dark ${highlight ? "bg-amber-50/80 font-medium" : ""}`}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
