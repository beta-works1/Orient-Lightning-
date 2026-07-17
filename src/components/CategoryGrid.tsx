import Link from "next/link";
import { CATEGORY_TILES } from "@/lib/types";

function CategoryIcon({ type }: { type: string }) {
  const common = "h-8 w-8 text-brand";
  switch (type) {
    case "bulb":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11v1h6v-1a6 6 0 0 0-3-11z" />
        </svg>
      );
    case "panel":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4" y="4" width="16" height="16" rx="1" />
          <path d="M4 12h16M12 4v16" />
        </svg>
      );
    default:
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="7" />
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
  }
}

export function CategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="font-display text-2xl text-brand-navy sm:text-3xl">Shop by Category</h2>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {CATEGORY_TILES.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="flex flex-col items-center gap-2 rounded-lg border border-brand-border bg-white px-3 py-5 text-center transition hover:border-brand hover:shadow-sm"
          >
            <CategoryIcon type={tile.icon} />
            <span className="text-sm font-medium text-brand-dark">{tile.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
