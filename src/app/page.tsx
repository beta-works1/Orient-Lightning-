import { LandingHero } from "@/components/landing/LandingHero";
import { LandingCategories } from "@/components/landing/LandingCategories";
import {
  LandingCompareCta,
  LandingConfidence,
  LandingSmart,
} from "@/components/landing/LandingSections";
import { LandingFlagships } from "@/components/landing/LandingFlagships";
import { FindYourFit } from "@/components/landing/FindYourFit";
import { AnimatedStats } from "@/components/landing/AnimatedStats";
import { CustomerLogos, Testimonials, TrustBadges } from "@/components/HomeSections";
import { ProductRail } from "@/components/ProductRail";
import { FindAStoreCta } from "@/components/stores/FindAStoreCta";
import { OrientLampSection } from "@/components/landing/OrientLampSection";
import { Reveal, MotionLink } from "@/components/motion/Reveal";
import { getAllProducts, getFeaturedProducts } from "@/lib/catalog";
import { CUSTOMER_LOGOS } from "@/lib/types";

export default async function HomePage() {
  const featured = await getFeaturedProducts(8);
  const productCount = (await getAllProducts()).length;
  const years = new Date().getFullYear() - 1996;

  const stats = [
    { value: years, suffix: "+", label: "Years lighting Pakistan" },
    { value: productCount, suffix: "+", label: "Products in this catalog" },
    { value: CUSTOMER_LOGOS.length, suffix: "+", label: "Institutional clients featured" },
    { value: 1996, label: "Brand founding year" },
  ];

  return (
    <>
      <LandingHero />
      <Reveal>
        <LandingCategories />
      </Reveal>
      <Reveal>
        <div className="border-y border-brand-border/60 bg-brand-ice/40">
          <ProductRail title="Featured this week" products={featured} href="/collections/best-sellers" />
        </div>
      </Reveal>
      <Reveal>
        <FindAStoreCta />
      </Reveal>
      <Reveal>
        <FindYourFit />
      </Reveal>
      <Reveal>
        <LandingCompareCta />
      </Reveal>
      <Reveal>
        <LandingFlagships />
      </Reveal>
      <OrientLampSection />
      <Reveal>
        <LandingConfidence />
      </Reveal>
      <Reveal>
        <LandingSmart />
      </Reveal>
      <Reveal>
        <Testimonials />
      </Reveal>
      <Reveal>
        <AnimatedStats stats={stats} />
      </Reveal>
      <Reveal>
        <CustomerLogos />
      </Reveal>
      <TrustBadges />
      <Reveal>
        <section className="bg-brand-navy py-12 text-center text-white">
          <p className="text-sm text-white/70">Need a project quote or dealer partnership?</p>
          <MotionLink
            href="/pages/become-our-partner"
            className="mt-3 inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-brand hover:bg-slate-100"
          >
            Talk to Orient Lighting
          </MotionLink>
        </section>
      </Reveal>
    </>
  );
}
