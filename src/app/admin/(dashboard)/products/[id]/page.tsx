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
        <Link href="/admin/products" className="text-sm text-slate-500 hover:text-slate-800">
          ← Products
        </Link>
      </div>
      <h1 className="mb-2 text-2xl font-bold">Edit product</h1>
      {sp.saved ? (
        <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Saved.</p>
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
          sku: product.sku,
          productType: product.productType || "",
          vendor: product.vendor || "Orient",
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
