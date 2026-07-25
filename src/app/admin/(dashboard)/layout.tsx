import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-white/15 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:gap-4">
            <Link href="/admin/products" className="text-sm font-bold tracking-wide text-[#0F428F]">
              Orient Admin
            </Link>
            <nav className="flex flex-wrap gap-1 text-sm sm:gap-2">
              <Link
                href="/admin/products"
                className="rounded-md px-2 py-1 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                Products
              </Link>
              <Link
                href="/admin/products/new"
                className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Add product
              </Link>
              <Link
                href="/admin/catalogue"
                className="rounded-md bg-[#0F428F]/10 px-2 py-1 font-medium text-[#0F428F] hover:bg-[#0F428F]/15"
              >
                Catalogue
              </Link>
              {/* Hard navigation remounts the storefront shell cleanly */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/"
                className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Homepage
              </a>
            </nav>
          </div>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="min-h-[44px] rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
