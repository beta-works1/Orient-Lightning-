import dynamic from "next/dynamic";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingCategories } from "@/components/landing/LandingCategories";
import {
  LandingCompareCta,
  LandingConfidence,
  LandingSmart,
} from "@/components/landing/LandingSections";
import { FindYourFit } from "@/components/landing/FindYourFit";
import { ProductRail } from "@/components/ProductRail";
import { FindAStoreCta } from "@/components/stores/FindAStoreCta";
import { Reveal, MotionLink } from "@/components/motion/Reveal";
import { getFeaturedProducts, getPublishedProductCount } from "@/lib/catalog";
import { getCatalogueDownload } from "@/lib/catalogueSettings";
import { getFeaturedSetting } from "@/lib/featuredSettings";
import { CUSTOMER_LOGOS } from "@/lib/types";

const LandingFlagships = dynamic(() =>
  import("@/components/landing/LandingFlagships").then((m) => m.LandingFlagships),
);
const OrientLampSection = dynamic(() =>
  import("@/components/landing/OrientLampSection").then((m) => m.OrientLampSection),
);
const AnimatedStats = dynamic(() =>
  import("@/components/landing/AnimatedStats").then((m) => m.AnimatedStats),
);
const Testimonials = dynamic(() =>
  import("@/components/HomeSections").then((m) => m.Testimonials),
);
const CustomerLogos = dynamic(() =>
  import("@/components/HomeSections").then((m) => m.CustomerLogos),
);
const TrustBadges = dynamic(() =>
  import("@/components/HomeSections").then((m) => m.TrustBadges),
);

export default async function HomePage() {
  const [featured, productCount, catalogue, featuredMeta] = await Promise.all([
    getFeaturedProducts(8),
    getPublishedProductCount(),
    getCatalogueDownload(),
    getFeaturedSetting(),
  ]);
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
          <ProductRail
            title={featuredMeta.title}
            products={featured}
            href={featuredMeta.viewAllHref}
          />
        </div>
      </Reveal>
      <Reveal>
        <FindAStoreCta />
      </Reveal>
      <Reveal>
        <FindYourFit />
      </Reveal>
      <Reveal>
        <LandingCompareCta catalogue={catalogue} />
      </Reveal>
      <Reveal>
        <LandingFlagships />
      </Reveal>
      <OrientLampSection />
      <Reveal>
        <LandingConfidence />
      </Reveal>
      <Reveal>
        <LandingSmart catalogue={catalogue} />
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
