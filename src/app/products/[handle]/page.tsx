import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductPurchase } from "@/components/ProductPurchase";
import { ProductRail } from "@/components/ProductRail";
import { getProductByHandle, getRelatedProducts } from "@/lib/catalog";
import { getCatalogueDownload } from "@/lib/catalogueSettings";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return { title: "Product" };
  return {
    title: product.seoTitle || product.title,
    description: product.seoDescription || product.title,
    openGraph: {
      title: product.title,
      description: product.seoDescription,
      images: product.images[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const [related, catalogue] = await Promise.all([
    getRelatedProducts(product, 4),
    getCatalogueDownload(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} title={product.title} />
        <ProductPurchase product={product} catalogue={catalogue} />
      </div>

      {product.description ? (
        <section className="mt-12 border-t border-brand-border pt-8">
          <h2 className="font-display text-2xl text-brand-navy">Description</h2>
          <div
            className="prose-product mt-4 max-w-3xl text-sm text-brand-charcoal"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
          />
        </section>
      ) : null}

      <ProductRail title="Related Products" products={related} />
    </div>
  );
}
