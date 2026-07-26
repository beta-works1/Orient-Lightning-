"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useCompare } from "./CompareProvider";

export function CompareBar() {
  const { items, remove, clear, message, ready } = useCompare();
  const pathname = usePathname();
  const visible = ready && items.length > 0 && pathname !== "/compare";

  // Lift Ask Orient / WhatsApp above this bar (read by .orient-fab-stack).
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--orient-fab-offset", visible ? "6.5rem" : "0px");
    return () => root.style.setProperty("--orient-fab-offset", "0px");
  }, [visible]);

  if (!visible) return null;

  const href = `/compare?products=${items.map((i) => i.handle).join(",")}`;

  return (
    <>
      {message ? (
        <div className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-md bg-brand-navy px-4 py-2 text-sm text-white shadow-lg">
          {message}
        </div>
      ) : null}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-border bg-white/95 shadow-[0_-4px_20px_rgba(15,66,143,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-brand-navy">
              Compare ({items.length}/4)
            </span>
            {items.map((item) => (
              <div
                key={item.handle}
                className="flex shrink-0 items-center gap-2 rounded-md border border-brand-border bg-slate-50 py-1 pl-1 pr-2"
              >
                <div className="relative h-10 w-10 overflow-hidden rounded bg-white">
                  {item.image ? (
                    <Image src={item.image} alt="" fill sizes="40px" className="object-contain p-0.5" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[8px] text-brand-muted">N/A</div>
                  )}
                </div>
                <span className="max-w-[100px] truncate text-xs text-brand-dark sm:max-w-[140px]">
                  {item.title}
                </span>
                <button
                  type="button"
                  onClick={() => remove(item.handle)}
                  className="text-brand-muted hover:text-brand-sale"
                  aria-label={`Remove ${item.title}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={clear}
              className="hidden text-xs text-brand-muted hover:text-brand-navy sm:inline"
            >
              Clear
            </button>
            <Link
              href={href}
              className={`rounded-md px-4 py-2 text-sm font-semibold text-white transition ${
                items.length >= 2 ? "bg-brand hover:bg-brand-navy" : "pointer-events-none bg-slate-300"
              }`}
              aria-disabled={items.length < 2}
            >
              Compare
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
