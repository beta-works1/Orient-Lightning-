import Image from "next/image";
import { ShopByCategory } from "@/components/landing/ShopByCategory";
import { SpaceCards } from "@/components/landing/SpaceCards";

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

        <SpaceCards />
        <ShopByCategory />
      </div>
    </section>
  );
}
