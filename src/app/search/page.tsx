import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { searchProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Search",
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const results = q ? await searchProducts(q) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl text-brand-navy">Search</h1>
      <form action="/search" className="mt-4 flex max-w-xl gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search bulbs, panels, flood lights..."
          className="w-full rounded-md border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy"
        >
          Search
        </button>
      </form>

      {q ? (
        <p className="mt-6 text-sm text-brand-muted">
          {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
        </p>
      ) : (
        <p className="mt-6 text-sm text-brand-muted">Enter a keyword to find products.</p>
      )}

      {results.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
