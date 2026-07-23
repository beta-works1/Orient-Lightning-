"use client";

import Image from "next/image";
import { Suspense, type ReactNode } from "react";
import { AdminNavProgress } from "@/components/admin/AdminNavProgress";

export function AdminShell({ children }: { children: ReactNode }) {
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

      <div className="relative z-0 min-h-screen">{children}</div>
    </div>
  );
}
