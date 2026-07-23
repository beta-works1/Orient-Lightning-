import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import {
  filterProducts,
  getCollectionByHandle,
  getProductsForCollection,
} from "@/lib/catalog";

type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const collection = await getCollectionByHandle(handle);
  if (!collection) return { title: "Collection" };
  return {
    title: collection.title,
    description: collection.description?.replace(/<[^>]+>/g, "").slice(0, 160) || collection.title,
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { handle } = await params;
  const sp = await searchParams;
  const collection = await getCollectionByHandle(handle);
  if (!collection) notFound();

  const wattage = typeof sp.wattage === "string" ? sp.wattage : undefined;
  const colorTemp = typeof sp.colorTemp === "string" ? sp.colorTemp : undefined;
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;

  const products = filterProducts(await getProductsForCollection(handle), {
    wattage,
    colorTemp,
    sort,
  });

  const wattages = Array.from(
    new Set(products.flatMap((p) => p.facets?.wattage || [])),
  ).sort((a, b) => Number(a) - Number(b));
  const temps = Array.from(
    new Set(products.flatMap((p) => p.facets?.colorTemp || [])),
  ).sort();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-brand-navy">{collection.title}</h1>
        {collection.description ? (
          <div
            className="prose-product mt-3 max-w-3xl text-sm text-brand-muted"
            dangerouslySetInnerHTML={{ __html: collection.description }}
          />
        ) : (
          <p className="mt-2 text-sm text-brand-muted">
            Browse {collection.title} from Orient Lighting.
          </p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-6 rounded-lg border border-brand-border bg-slate-50 p-4 h-fit">
          <div>
            <h2 className="text-sm font-semibold text-brand-navy">Sort</h2>
            <div className="mt-2 flex flex-col gap-1 text-sm">
              {[
                ["", "Featured"],
                ["price-asc", "Price: Low to High"],
                ["price-desc", "Price: High to Low"],
                ["title-asc", "Name A–Z"],
              ].map(([value, label]) => {
                const q = new URLSearchParams();
                if (wattage) q.set("wattage", wattage);
                if (colorTemp) q.set("colorTemp", colorTemp);
                if (value) q.set("sort", value);
                return (
                  <Link
                    key={label}
                    href={`/collections/${handle}?${q.toString()}`}
                    className={!sort && !value || sort === value ? "text-brand font-medium" : "text-brand-dark hover:text-brand"}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          {wattages.length ? (
            <div>
              <h2 className="text-sm font-semibold text-brand-navy">Wattage</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {wattages.map((w) => {
                  const q = new URLSearchParams();
                  q.set("wattage", w);
                  if (colorTemp) q.set("colorTemp", colorTemp);
                  if (sort) q.set("sort", sort);
                  return (
                    <Link
                      key={w}
                      href={`/collections/${handle}?${q.toString()}`}
                      className={`rounded-full border px-2.5 py-1 text-xs ${
                        wattage === w
                          ? "border-brand bg-brand text-white"
                          : "border-brand-border text-brand-dark hover:border-brand"
                      }`}
                    >
                      {w}W
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          {temps.length ? (
            <div>
              <h2 className="text-sm font-semibold text-brand-navy">Color Temperature</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {temps.map((t) => {
                  const q = new URLSearchParams();
                  if (wattage) q.set("wattage", wattage);
                  q.set("colorTemp", t);
                  if (sort) q.set("sort", sort);
                  return (
                    <Link
                      key={t}
                      href={`/collections/${handle}?${q.toString()}`}
                      className={`rounded-full border px-2.5 py-1 text-xs ${
                        colorTemp === t
                          ? "border-brand bg-brand text-white"
                          : "border-brand-border text-brand-dark hover:border-brand"
                      }`}
                    >
                      {t}K
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          {(wattage || colorTemp || sort) && (
            <Link href={`/collections/${handle}`} className="text-xs text-brand hover:underline">
              Clear filters
            </Link>
          )}
        </aside>

        <div>
          <p className="mb-4 text-sm text-brand-muted">{products.length} products</p>
          {products.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-brand-border p-8 text-center text-sm text-brand-muted">
              No products match these filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
