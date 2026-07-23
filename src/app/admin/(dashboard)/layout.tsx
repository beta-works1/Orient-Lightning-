import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/admin/products" className="text-sm font-bold tracking-wide">
              Orient Admin
            </Link>
            <nav className="flex gap-3 text-sm">
              <Link href="/admin/products" className="text-slate-600 hover:text-slate-900">
                Products
              </Link>
              <Link href="/" className="text-slate-600 hover:text-slate-900" target="_blank">
                View site
              </Link>
            </nav>
          </div>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="min-h-[44px] rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
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
