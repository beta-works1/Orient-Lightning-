"use client";

import { usePathname } from "next/navigation";
import { SITE } from "@/lib/types";

/**
 * Always render the same DOM node to avoid hydration mismatches.
 * On the homepage we only hide it visually (hero is full-bleed).
 */
export function AnnouncementBar() {
  const pathname = usePathname();
  const hide = pathname === "/";

  return (
    <div
      className={`bg-brand text-center text-xs text-white sm:text-sm py-2 px-3 ${
        hide ? "hidden" : ""
      }`}
      aria-hidden={hide}
    >
      {SITE.announcement}
    </div>
  );
}
