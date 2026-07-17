import Link from "next/link";
import { CategoryGrid } from "@/components/CategoryGrid";
import { DailyDeal } from "@/components/DailyDeal";
import { BrandBlurb, CustomerLogos, Testimonials, TrustBadges } from "@/components/HomeSections";
import { ProductRail } from "@/components/ProductRail";
import { PromoBanners } from "@/components/PromoBanners";
import { getDailyDealProducts, getFeaturedProducts } from "@/lib/catalog";
import { SITE } from "@/lib/types";
import { whatsappGeneralUrl } from "@/lib/format";

export default function HomePage() {
  const featured = getFeaturedProducts(8);
  const deals = getDailyDealProducts(4);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand via-brand to-brand-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.25em] text-white/70">Since 1996</p>
            <h1 className="mt-2 font-display text-4xl font-semibold leading-tight sm:text-5xl">
              {SITE.name}
            </h1>
            <p className="mt-4 text-base text-white/85 sm:text-lg">
              Residential, commercial and industrial LED lighting — powered by Photon Electric Pvt Ltd.
              Online checkout is paused; order easily on WhatsApp.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={whatsappGeneralUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-brand hover:bg-slate-100"
              >
                Chat on WhatsApp
              </a>
              <Link
                href="/collections/best-sellers"
                className="rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Shop Best Sellers
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            {["Bulbs", "Panels", "Flood", "Highbay"].map((label) => (
              <div
                key={label}
                className="flex aspect-[4/3] items-end rounded-lg bg-white/10 p-4 ring-1 ring-white/20"
              >
                <span className="font-display text-lg">{label}</span>
              </div>
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
