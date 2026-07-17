import Image from "next/image";
import Link from "next/link";
import { CATEGORY_TILES } from "@/lib/types";

export function CategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="font-display text-2xl text-brand-navy sm:text-3xl">Shop by Category</h2>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {CATEGORY_TILES.map((tile) => (
          <Link
            key={tile.href + tile.label}
            href={tile.href}
            className="flex flex-col items-center gap-2 rounded-lg border border-brand-border bg-white px-3 py-5 text-center transition hover:border-brand hover:shadow-sm"
          >
            <span className="relative flex h-14 w-14 items-center justify-center sm:h-16 sm:w-16">
              <Image
                src={tile.image}
                alt=""
                width={64}
                height={64}
                className="h-full w-full object-contain"
              />
            </span>
            <span className="text-sm font-medium text-brand-dark">{tile.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
