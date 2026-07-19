import Image from "next/image";
import Link from "next/link";
import { CATEGORY_TILES } from "@/lib/types";

export function CategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <h2 className="type-display text-[1.65rem] text-brand-navy sm:text-3xl">Shop by Category</h2>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {CATEGORY_TILES.map((tile) => (
          <Link
            key={tile.href + tile.label}
            href={tile.href}
            className="group flex min-h-[44px] cursor-pointer flex-col items-center gap-3 rounded-2xl border border-brand-border bg-white px-3 py-5 text-center transition duration-200 hover:border-brand hover:shadow-bloom"
          >
            <span className="relative flex h-16 w-16 items-center justify-center sm:h-[4.5rem] sm:w-[4.5rem]">
              <Image
                src={tile.image}
                alt=""
                width={72}
                height={72}
                className="h-full w-full object-contain transition duration-200 group-hover:scale-105"
              />
            </span>
            <span className="text-sm font-medium text-brand-dark">{tile.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
