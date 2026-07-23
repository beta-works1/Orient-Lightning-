"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AdminLoadingOverlay } from "@/components/admin/AnimatedLoader";

/**
 * Shows an animated overlay while admin routes are transitioning.
 * Covers soft navigations (Link clicks) where Next may not remount loading.tsx.
 */
export function AdminNavProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const key = `${pathname}?${search.toString()}`;
  const [visible, setVisible] = useState(false);
  const first = useRef(true);
  const hideTimer = useRef<number | null>(null);
  const safetyTimer = useRef<number | null>(null);

  const show = () => {
    setVisible(true);
    if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
    safetyTimer.current = window.setTimeout(() => setVisible(false), 4000);
  };

  const scheduleHide = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setVisible(false), 320);
  };

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    show();
    scheduleHide();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [key]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest("a");
      if (!el) return;
      const href = el.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (el.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (!url.pathname.startsWith("/admin")) return;
        if (url.pathname === pathname && url.search === window.location.search) return;
        show();
      } catch {
        /* ignore */
      }
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
    };
  }, [pathname]);

  if (!visible) return null;
  return <AdminLoadingOverlay label="Loading" />;
}
