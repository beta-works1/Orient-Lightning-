import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllCollections, getProductById } from "@/lib/catalog";
import { ProductForm } from "@/components/admin/ProductForm";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function EditProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const product = await getProductById(id);
  if (!product) notFound();
  const collections = await getAllCollections();

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/admin/products"
          className="rounded-md bg-white/90 px-2 py-1 text-sm text-slate-600 shadow-sm hover:text-slate-900"
        >
          ← Products
        </Link>
      </div>
      <h1 className="mb-2 text-2xl font-bold text-white drop-shadow">Edit product</h1>
      {sp.saved ? (
        <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Saved.
        </p>
      ) : null}
      <ProductForm
        mode="edit"
        productId={product.id}
        collections={collections.map((c) => ({ handle: c.handle, title: c.title }))}
        initial={{
          title: product.title,
          handle: product.handle,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          productType: product.productType || "",
          status: (product.status as "draft" | "published") || "published",
          wattage: (product.facets?.wattage || []).join(", "),
          colorTemp: (product.facets?.colorTemp || []).join(", "),
          options: (product.options?.[0]?.values || []).join(", "),
          images: product.images,
          collectionHandles: product.collectionIds,
        }}
      />
    </div>
  );
}
