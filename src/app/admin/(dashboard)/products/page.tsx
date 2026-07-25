import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

type Props = { searchParams: Promise<{ q?: string; deleted?: string }> };

export default async function AdminProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q || "").trim().toLowerCase();
  const all = await getAllProducts({ includeDrafts: true });
  const products = q
    ? all.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.handle.toLowerCase().includes(q) ||
          (p.productType || "").toLowerCase().includes(q),
      )
    : all;

  return (
    <div>
      <div className="flex flex-col gap-3 rounded-2xl border border-white/30 bg-white/90 p-4 shadow-xl shadow-black/10 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">{products.length} shown · create, edit, or delete</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/featured"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#0F428F] bg-white px-4 text-sm font-semibold text-[#0F428F] hover:bg-[#0F428F]/5"
          >
            Featured this week
          </Link>
          <Link
            href="/admin/catalogue"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#0F428F] bg-white px-4 text-sm font-semibold text-[#0F428F] hover:bg-[#0F428F]/5"
          >
            Catalogue PDF
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0F428F] px-4 text-sm font-semibold text-white hover:bg-[#162950]"
          >
            Add product
          </Link>
        </div>
      </div>

      {sp.deleted ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Product deleted.
        </p>
      ) : null}

      <form className="mt-4">
        <input
          name="q"
          defaultValue={sp.q || ""}
          placeholder="Search title, link, or type…"
          className="w-full max-w-md rounded-md border border-white/40 bg-white/95 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#0F428F]"
        />
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-white/40 bg-white/95 shadow-xl shadow-black/10 backdrop-blur-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/90 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Product</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                  No products match this search.
                </td>
              </tr>
            ) : null}
            {products.map((p) => {
              const status = (p as { status?: string }).status || "published";
              return (
                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100">
                        {p.images[0] ? (
                          <Image src={p.images[0]} alt="" fill className="object-contain p-1" sizes="48px" />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{p.title}</div>
                        <div className="text-xs text-slate-500">{p.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{formatPrice(p.price)}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        status === "published"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="min-h-[44px] rounded-md border border-slate-300 px-3 py-2 text-xs font-medium hover:bg-slate-50"
                      >
                        Edit
                      </Link>
                      <DeleteProductButton id={p.id} title={p.title} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
