import type { Metadata } from "next";
import Link from "next/link";
import { getProductByHandle } from "@/lib/catalog";
import { CompareTable } from "@/components/compare/CompareTable";

export const metadata: Metadata = {
  title: "Compare products",
  description: "Side-by-side comparison of Orient Lighting LED products.",
};

type Props = {
  searchParams: Promise<{ products?: string }>;
};

export default async function ComparePage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = typeof sp.products === "string" ? sp.products : "";
  const handles = [
    ...new Set(
      raw
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean),
    ),
  ].slice(0, 4);

  const products = (
    await Promise.all(handles.map((h) => getProductByHandle(h)))
  ).filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-brand-navy">Compare products</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Select up to 4 products from listings or product pages, then review specs side by side.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-brand-border bg-slate-50 px-6 py-16 text-center">
          <p className="text-brand-dark">No products selected for comparison.</p>
          <p className="mt-1 text-sm text-brand-muted">
            Browse a collection and tap Compare on products you want to evaluate.
          </p>
          <Link
            href="/collections/best-sellers"
            className="mt-6 inline-block rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy"
          >
            Browse products
          </Link>
        </div>
      ) : products.length === 1 ? (
        <div className="space-y-4">
          <p className="rounded-md border border-brand-border bg-slate-50 px-4 py-3 text-sm text-brand-dark">
            Add at least one more product to compare. Use the Compare button on product cards.
          </p>
          <CompareTable products={products} />
        </div>
      ) : (
        <CompareTable products={products} />
      )}
    </div>
  );
}
