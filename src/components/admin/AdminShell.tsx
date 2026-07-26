"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { AdminNavProgress } from "@/components/admin/AdminNavProgress";
import { logoutAdmin } from "@/app/admin/logout";

const NAV = [
  { href: "/admin/products", label: "Products" },
  { href: "/admin/featured", label: "Featured" },
  { href: "/admin/catalogue", label: "Catalogue" },
  { href: "/admin/products/new", label: "Add product" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const showNav = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");

  return (
    <div className="relative min-h-screen text-slate-900 antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <Image
          src="/images/promo/residential-1.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1C33]/88 via-[#0F428F]/72 to-[#162950]/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(91,156,255,0.18),transparent_55%)]" />
      </div>

      <Suspense fallback={null}>
        <AdminNavProgress />
      </Suspense>

      {showNav ? (
        <header className="relative z-10 border-b border-white/15 bg-white/90 shadow-sm backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:gap-4">
              <Link href="/admin/products" className="text-sm font-bold tracking-wide text-[#0F428F]">
                Orient Admin
              </Link>
              <nav className="flex flex-wrap gap-1 text-sm sm:gap-2">
                {NAV.map((item) => {
                  const active =
                    item.href === "/admin/products"
                      ? pathname === "/admin/products" || pathname.startsWith("/admin/products/")
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const isAccent =
                    item.href === "/admin/catalogue" || item.href === "/admin/featured";
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        isAccent
                          ? "rounded-md bg-[#0F428F] px-2.5 py-1 font-semibold text-white hover:bg-[#162950]"
                          : active
                            ? "rounded-md px-2 py-1 font-medium text-[#0F428F] hover:bg-slate-100"
                            : "rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
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
      ) : null}

      <div className="relative z-0 min-h-screen">{children}</div>
    </div>
  );
}
