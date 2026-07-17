import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CategoryGrid } from "@/components/CategoryGrid";
import { DailyDeal } from "@/components/DailyDeal";
import { DownloadCatalogue } from "@/components/DownloadCatalogue";
import { BrandBlurb, CustomerLogos, Testimonials, TrustBadges } from "@/components/HomeSections";
import { ProductRail } from "@/components/ProductRail";
import { PromoBanners } from "@/components/PromoBanners";
import { getDailyDealProducts, getFeaturedProducts } from "@/lib/catalog";
import { SITE } from "@/lib/types";

const HERO_TILES = [
  { label: "Bulbs", image: "/images/categories/bulbs-icon.png", href: "/collections/bulbs" },
  {
    label: "Panels",
    image: "/images/categories/panels-icon.png",
    href: "/collections/led-recessed-surface-panels",
  },
  {
    label: "Flood",
    image: "/images/categories/flood-lights-icon.png",
    href: "/collections/flood-lights",
  },
  {
    label: "Highbay",
    image: "/images/categories/highbay-lights-icon.png",
    href: "/collections/highbay-lights",
  },
] as const;

export default function HomePage() {
  const featured = getFeaturedProducts(8);
  const deals = getDailyDealProducts(4);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand via-brand to-brand-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex rounded-md bg-white/95 px-3 py-2">
              <BrandLogo variant="header" className="brightness-100" />
            </div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/70">Since 1996</p>
            <h1 className="mt-2 font-display text-4xl font-semibold leading-tight sm:text-5xl">
              {SITE.name}
            </h1>
            <p className="mt-4 text-base text-white/85 sm:text-lg">
              Residential, commercial and industrial LED lighting — powered by Photon Electric Pvt Ltd.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/collections/best-sellers"
                className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-brand hover:bg-slate-100"
              >
                Shop Best Sellers
              </Link>
              <Link
                href="/collections/residential-lighting"
                className="rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Browse Residential
              </Link>
              <DownloadCatalogue variant="hero" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            {HERO_TILES.map((tile) => (
              <Link
                key={tile.label}
                href={tile.href}
                className="relative flex aspect-[4/3] items-end overflow-hidden rounded-lg bg-white/10 p-4 ring-1 ring-white/20"
              >
                <Image
                  src={tile.image}
                  alt=""
                  width={96}
                  height={96}
                  className="pointer-events-none absolute right-2 top-2 h-14 w-14 object-contain opacity-90 sm:h-16 sm:w-16"
                />
                <span className="relative font-display text-lg">{tile.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CategoryGrid />
      <ProductRail title="Featured Products" products={featured} href="/collections/best-sellers" />
      <PromoBanners />
      <DailyDeal products={deals} />
      <BrandBlurb />
      <CustomerLogos />
      <Testimonials />
      <TrustBadges />
    </>
  );
}
