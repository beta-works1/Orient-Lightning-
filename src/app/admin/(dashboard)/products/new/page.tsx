import Link from "next/link";
import { getAllCollections } from "@/lib/catalog";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const collections = await getAllCollections();

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin/products" className="text-sm text-slate-500 hover:text-slate-800">
          ← Products
        </Link>
      </div>
      <h1 className="mb-4 text-2xl font-bold">New product</h1>
      <ProductForm
        mode="create"
        collections={collections.map((c) => ({ handle: c.handle, title: c.title }))}
      />
    </div>
  );
}
