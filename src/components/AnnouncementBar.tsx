"use client";

import { usePathname } from "next/navigation";
import { SITE } from "@/lib/types";

export function AnnouncementBar() {
  const pathname = usePathname();
  // Full-bleed hero on home — announcement would break the overlay composition
  if (pathname === "/") return null;

  return (
    <div className="bg-brand text-center text-xs text-white sm:text-sm py-2 px-3">
      {SITE.announcement}
    </div>
  );
}
