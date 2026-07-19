import Image from "next/image";
import Link from "next/link";
import { ShopByCategory } from "@/components/landing/ShopByCategory";

const SPACES = [
  {
    title: "Residential",
    blurb: "Bulbs, downlights, battens and panels for comfortable, efficient homes.",
    href: "/collections/residential-lighting",
    image: "/images/categories/bulbs-icon.png",
  },
  {
    title: "Commercial",
    blurb: "Flood, highbay and street lighting for offices, retail and campuses.",
    href: "/collections/commercial-lighting",
    image: "/images/categories/flood-lights-icon.png",
  },
  {
    title: "Industrial",
    blurb: "Highbay and outdoor luminaires for warehouses, yards and roads.",
    href: "/collections/highbay-lights",
    image: "/images/categories/highbay-lights-icon.png",
  },
] as const;

export function LandingCategories() {
  return (
    <section className="section-space bg-brand-ice" aria-labelledby="innovation-heading">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="type-kicker text-brand">Our Range</p>
          <h2 id="innovation-heading" className="type-display mt-3 text-brand-navy">
            Illumination for Every Space
          </h2>
          <p className="type-body mt-4 text-brand-muted">
            From homes to highways, Orient Lighting brings technologically advanced LED solutions
            designed for Pakistani spaces since 1996.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {SPACES.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group flex min-h-[44px] cursor-pointer flex-col rounded-2xl border border-brand-border bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-brand hover:shadow-bloom focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-brand-off">
                <Image
                  src={cat.image}
                  alt=""
                  width={48}
                  height={48}
                  className="h-10 w-10 object-contain"
                />
              </div>
              <h3 className="type-title text-brand-navy group-hover:text-brand">{cat.title}</h3>
              <p className="type-caption mt-2 flex-1 text-brand-muted">{cat.blurb}</p>
              <span className="mt-5 text-sm font-semibold text-brand">Explore Range →</span>
            </Link>
          ))}
        </div>

        <ShopByCategory />
      </div>
    </section>
  );
}
