"use client";

import Link from "next/link";
import { useCompare } from "./CompareProvider";

export function CompareHeaderLink() {
  const { items, ready } = useCompare();
  const count = ready ? items.length : 0;
  const href =
    count > 0
      ? `/compare?products=${items.map((i) => i.handle).join(",")}`
      : "/compare";

  return (
    <Link href={href} aria-label="Compare products" className="relative hover:text-brand">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="7" height="16" rx="1" />
        <rect x="14" y="4" width="7" height="16" rx="1" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
