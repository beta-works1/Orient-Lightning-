import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { ADMIN_PRODUCT_COLLECTIONS } from "@/lib/types";

export default function NewProductPage() {
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
      <ProductForm mode="create" collections={[...ADMIN_PRODUCT_COLLECTIONS]} />
    </div>
  );
}
