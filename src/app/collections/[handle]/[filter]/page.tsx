import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import {
  filterProducts,
  getCollectionByHandle,
  getProductsForCollection,
} from "@/lib/catalog";

type Props = {
  params: Promise<{ handle: string; filter: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, filter } = await params;
  const collection = await getCollectionByHandle(handle);
  return {
    title: collection ? `${collection.title} — ${filter}` : filter,
  };
}

export default async function CollectionFilterPage({ params }: Props) {
  const { handle, filter } = await params;
  const [collection, collectionProducts] = await Promise.all([
    getCollectionByHandle(handle),
    getProductsForCollection(handle),
  ]);
  if (!collection) notFound();

  // Color-temp style filters like 6500k
  const colorTempMatch = filter.match(/^(\d{4})k$/i);
  if (colorTempMatch) {
    const products = filterProducts(collectionProducts, {
      colorTemp: colorTempMatch[1],
    });
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-display text-3xl text-brand-navy">
          {collection.title} — {colorTempMatch[1]}K
        </h1>
        <p className="mt-2 text-sm text-brand-muted">{products.length} products</p>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    );
  }

  redirect(`/collections/${handle}`);
}
