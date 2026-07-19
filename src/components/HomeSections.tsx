"use client";

import { useEffect, useState } from "react";
import { CUSTOMER_LOGOS, TESTIMONIALS, TRUST_BADGES } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export function BrandBlurb() {
  return (
    <section className="section-space mx-auto max-w-7xl px-4 text-center">
      <h2 className="type-display text-[1.65rem] text-brand-navy sm:text-3xl">We Do Things Differently</h2>
      <p className="type-body mx-auto mt-4 max-w-2xl text-brand-muted">
        Since 1996, Orient Lighting (Photon Electric Pvt Ltd) has delivered reliable LED solutions for
        homes, offices, and industrial facilities across Pakistan — with quality components, local
        support, and application-ready ranges.
      </p>
      <Link
        href="/pages/become-our-partner"
        className="mt-6 inline-flex min-h-[44px] cursor-pointer items-center rounded-md border border-brand px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
      >
        About Us / Partner With Us
      </Link>
    </section>
  );
}

export function CustomerLogos() {
  const row = [...CUSTOMER_LOGOS, ...CUSTOMER_LOGOS];
  return (
    <section className="section-space bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="type-display text-center text-[1.65rem] text-brand-navy sm:text-3xl">
          Our Proud Customers
        </h2>
        <div className="mt-10 overflow-hidden">
          <div className="animate-marquee flex w-max items-center gap-10 sm:gap-14">
            {row.map((logo, i) => (
              <Image
                key={`${logo.name}-${i}`}
                src={logo.src}
                alt={logo.name}
                width={160}
                height={80}
                className="h-12 w-auto max-w-[9rem] shrink-0 object-contain sm:h-14 sm:max-w-[10.5rem]"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || TESTIMONIALS.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % TESTIMONIALS.length), 5500);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <section className="section-space bg-brand-ice">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="type-kicker text-brand">What People Say</p>
          <h2 className="type-display mt-3 text-[1.75rem] text-brand-navy sm:text-4xl">
            Trusted Across Pakistan
          </h2>
          <p className="type-caption mt-3 text-brand-muted">
            Sample quotes for layout — replace with verified customer feedback before launch.
          </p>
        </div>

        <div className="relative mx-auto mt-12 max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={TESTIMONIALS[index].name}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="rounded-3xl border border-brand-border bg-white p-8 shadow-sm sm:p-10"
            >
              <p className="font-display text-xl leading-relaxed text-brand-navy sm:text-2xl">
                &ldquo;{TESTIMONIALS[index].quote}&rdquo;
              </p>
              <footer className="mt-8 flex items-center gap-3 border-t border-brand-border pt-6">
                <span
                  aria-hidden
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-sm font-bold text-white"
                >
                  {TESTIMONIALS[index].name.charAt(0)}
                </span>
                <div>
                  <div className="text-sm font-semibold text-brand-navy">{TESTIMONIALS[index].name}</div>
                  <div className="text-xs text-brand-muted">Orient Lighting customer</div>
                </div>
              </footer>
            </motion.blockquote>
          </AnimatePresence>

          <div className="mt-6 flex justify-center gap-1">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.name}
                type="button"
                aria-label={`Show testimonial from ${t.name}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => setIndex(i)}
                className="flex h-11 w-11 cursor-pointer items-center justify-center"
              >
                <span
                  className={`block h-2.5 w-2.5 rounded-full transition ${
                    i === index ? "bg-brand" : "bg-brand-border hover:bg-brand/40"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Staggered desktop peek of all quotes */}
        <div className="mt-14 hidden gap-4 lg:grid lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.name}
              type="button"
              onClick={() => setIndex(i)}
              className={`cursor-pointer rounded-2xl border p-5 text-left transition duration-200 ${
                i === index
                  ? "border-brand bg-white shadow-bloom"
                  : "border-brand-border bg-white/70 hover:border-brand/40"
              } ${i === 1 ? "lg:translate-y-4" : ""}`}
            >
              <p className="line-clamp-3 text-sm leading-relaxed text-brand-dark">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 text-sm font-semibold text-brand">{t.name}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrustBadges() {
  return (
    <section className="bg-brand py-10 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-3">
        {TRUST_BADGES.map((b) => (
          <div key={b.title} className="text-center">
            <div className="font-display text-xl sm:text-2xl">{b.title}</div>
            <div className="mt-1 text-sm text-white/80">{b.subtitle}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
