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

  const [collection, collectionProducts] = await Promise.all([
    getCollectionByHandle(handle),
    getProductsForCollection(handle),
  ]);
  if (!collection) notFound();

  const wattage = typeof sp.wattage === "string" ? sp.wattage : undefined;
  const colorTemp = typeof sp.colorTemp === "string" ? sp.colorTemp : undefined;
  const lightTone = typeof sp.lightTone === "string" ? sp.lightTone : undefined;
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;

  const products = filterProducts(collectionProducts, {
    wattage,
    colorTemp,
    lightTone,
    sort,
  });

  const wattages = Array.from(
    new Set(collectionProducts.flatMap((p) => p.facets?.wattage || [])),
  ).sort((a, b) => Number(a) - Number(b));
  const temps = Array.from(
    new Set(collectionProducts.flatMap((p) => p.facets?.colorTemp || [])),
  ).sort((a, b) => Number(String(a).replace(/k$/i, "")) - Number(String(b).replace(/k$/i, "")));

  const toneOptions = [
    { id: "warm", label: "Warm light", kelvin: "3000" },
    { id: "natural", label: "Natural light", kelvin: "4000" },
    { id: "daylight", label: "Daylight", kelvin: "6500" },
  ] as const;

  const colorFilterOptions = toneOptions
    .map((t) => {
      const hasKelvin = temps.some((x) => String(x).replace(/k$/i, "") === t.kelvin);
      const hasAnyTemp = temps.length > 0;
      if (hasAnyTemp && !hasKelvin) {
        // Still show tone if collection has other temps — only include matching pairs when temps exist
        return null;
      }
      return {
        id: t.id,
        kelvin: t.kelvin,
        label: `${t.label}/${t.kelvin}K`,
      };
    })
    .filter((x): x is { id: string; kelvin: string; label: string } => x != null);

  // If no facet kelvins, fall back to tone-only labels with standard CCT
  const colorChips =
    colorFilterOptions.length > 0
      ? colorFilterOptions
      : toneOptions.map((t) => ({
          id: t.id,
          kelvin: t.kelvin,
          label: `${t.label}/${t.kelvin}K`,
        }));

  function buildQuery(extra: Record<string, string | undefined>) {
    const q = new URLSearchParams();
    const w = extra.wattage !== undefined ? extra.wattage : wattage;
    const t = extra.colorTemp !== undefined ? extra.colorTemp : colorTemp;
    const lt = extra.lightTone !== undefined ? extra.lightTone : lightTone;
    const s = extra.sort !== undefined ? extra.sort : sort;
    if (w) q.set("wattage", w);
    if (lt) q.set("lightTone", lt);
    if (t) q.set("colorTemp", t);
    if (s) q.set("sort", s);
    return q.toString();
  }

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

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6 rounded-xl border border-brand-border bg-slate-50 p-4 h-fit">
          <div>
            <h2 className="text-sm font-semibold text-brand-navy">Sort</h2>
            <div className="mt-2 flex flex-col gap-1 text-sm">
              {[
                ["", "Featured"],
                ["price-asc", "Price: Low to High"],
                ["price-desc", "Price: High to Low"],
                ["title-asc", "Name A–Z"],
              ].map(([value, label]) => (
                <Link
                  key={label}
                  href={`/collections/${handle}?${buildQuery({ sort: value || undefined })}`}
                  className={
                    (!sort && !value) || sort === value
                      ? "font-medium text-brand"
                      : "text-brand-dark hover:text-brand"
                  }
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {wattages.length ? (
            <div>
              <h2 className="text-sm font-semibold text-brand-navy">1. Wattage</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {wattages.map((w) => (
                  <Link
                    key={w}
                    href={`/collections/${handle}?${buildQuery({ wattage: w })}`}
                    className={`rounded-full border px-2.5 py-1 text-xs ${
                      wattage === w
                        ? "border-brand bg-brand text-white"
                        : "border-brand-border text-brand-dark hover:border-brand"
                    }`}
                  >
                    {w}W
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <h2 className="text-sm font-semibold text-brand-navy">2. Color temperature</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {colorChips.map((t) => {
                const active =
                  lightTone === t.id ||
                  colorTemp === t.kelvin ||
                  colorTemp === `${t.kelvin}k` ||
                  colorTemp === `${t.kelvin}K`;
                return (
                  <Link
                    key={t.id}
                    href={`/collections/${handle}?${buildQuery({
                      lightTone: t.id,
                      colorTemp: t.kelvin,
                    })}`}
                    className={`rounded-full border px-2.5 py-1 text-xs ${
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-brand-border text-brand-dark hover:border-brand"
                    }`}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {(wattage || colorTemp || lightTone || sort) && (
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
