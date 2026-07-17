import Image from "next/image";
import Link from "next/link";
import { CUSTOMER_LOGOS, TESTIMONIALS, TRUST_BADGES } from "@/lib/types";

export function BrandBlurb() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 text-center">
      <h2 className="font-display text-2xl text-brand-navy sm:text-3xl">We Do Things Differently</h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-brand-muted sm:text-base">
        Since 1996, Orient Lighting (Photon Electric Pvt Ltd) has delivered reliable LED solutions for
        homes, offices, and industrial facilities across Pakistan — with quality components, local
        support, and application-ready ranges.
      </p>
      <Link
        href="/pages/become-our-partner"
        className="mt-6 inline-flex rounded-md border border-brand px-5 py-2.5 text-sm font-semibold text-brand hover:bg-brand hover:text-white"
      >
        About Us / Partner With Us
      </Link>
    </section>
  );
}

export function CustomerLogos() {
  const row = [...CUSTOMER_LOGOS, ...CUSTOMER_LOGOS];
  return (
    <section className="border-y border-brand-border bg-white py-10">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-center font-display text-2xl text-brand-navy">Our Proud Customers</h2>
        <div className="mt-6 overflow-hidden">
          <div className="animate-marquee flex w-max gap-4">
            {row.map((logo, i) => (
              <div
                key={`${logo.name}-${i}`}
                className="flex h-16 w-36 items-center justify-center rounded-md border border-brand-border bg-slate-50 px-3"
              >
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={104}
                  height={52}
                  className="h-10 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-center font-display text-2xl text-brand-navy sm:text-3xl">What Customers Say</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <blockquote key={t.name} className="rounded-lg border border-brand-border bg-white p-5">
            <p className="text-sm leading-relaxed text-brand-dark">&ldquo;{t.quote}&rdquo;</p>
            <footer className="mt-4 text-sm font-semibold text-brand">{t.name}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

export function TrustBadges() {
  return (
    <section className="bg-brand py-8 text-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-3">
        {TRUST_BADGES.map((b) => (
          <div key={b.title} className="text-center">
            <div className="font-display text-xl">{b.title}</div>
            <div className="mt-1 text-sm text-white/80">{b.subtitle}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
