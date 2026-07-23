import Link from "next/link";
import { getAllCollections } from "@/lib/catalog";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
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
      <h1 className="mb-4 text-2xl font-bold text-white drop-shadow">New product</h1>
      <ProductForm
        mode="create"
        collections={collections.map((c) => ({ handle: c.handle, title: c.title }))}
      />
    </div>
  );
}
