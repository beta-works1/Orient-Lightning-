"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const SLIDES = [
  {
    title: "BRIGHT HOMES. LOWER BILLS.",
    description: "Efficient LED bulbs, downlights and panels for every room.",
    href: "/collections/residential-lighting",
    image: "/images/promo/residential-1.jpg",
    cta: "Shop Now",
  },
  {
    title: "WORKSPACES, PERFECTED.",
    description: "Commercial luminaires built for offices, retail and campuses.",
    href: "/collections/commercial-lighting",
    image: "/images/promo/commercial-1.jpg",
    cta: "Explore Commercial",
  },
  {
    title: "POWER FOR INDUSTRY.",
    description: "Highbay, flood and street lighting for demanding sites.",
    href: "/collections/highbay-lights",
    image: "/images/promo/industrial-1.jpg",
    cta: "Explore Industrial",
  },
  {
    title: "SMART LIGHT. SIMPLE CONTROL.",
    description: "Connected lighting that adapts to how you live and work.",
    href: "/collections/smart-lights",
    image: "/images/promo/residential-2.jpg",
    cta: "Explore Smart Lights",
  },
  {
    title: "OUTDOOR. ALL NIGHT.",
    description: "Flood and street lights engineered for Pakistani conditions.",
    href: "/collections/flood-lights",
    image: "/images/promo/commercial-2.jpg",
    cta: "Explore Outdoor",
  },
  {
    title: "PANELS THAT PERFORM.",
    description: "Recessed and surface LED panels with clean, even light.",
    href: "/collections/led-recessed-surface-panels",
    image: "/images/promo/industrial-2.jpg",
    cta: "Explore Panels",
  },
] as const;

function ArrowIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      {dir === "left" ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
    </svg>
  );
}

export function LandingHero() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);
    },
    [],
  );

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => go(1), 6500);
    return () => window.clearInterval(id);
  }, [reduce, go, index]);

  const slide = SLIDES[index];

  return (
    <section className="relative h-[100svh] min-h-[560px] max-h-[960px] overflow-hidden bg-brand-navy text-white">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={slide.image}
          className="absolute inset-0"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.2 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={slide.image}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            quality={90}
            className="object-cover object-center"
          />
          {/* Soft vignette — keeps the photo readable without drowning it */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-28 pt-28 sm:pb-32 lg:justify-center lg:pb-28 lg:pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.title}
            className="max-w-2xl"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: reduce ? 0.15 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-display text-[2.35rem] font-extrabold uppercase leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-[4.25rem]">
              {slide.title}
            </h1>
            <p className="mt-5 max-w-md text-base text-white/90 sm:text-lg">{slide.description}</p>
            <div className="mt-8">
              <Link
                href={slide.href}
                className="inline-flex rounded-full bg-brand px-7 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white hover:text-brand"
              >
                {slide.cta}
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed to hero frame — does not move when slide copy height changes */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
        <div className="pointer-events-auto mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 pb-8 sm:pb-10">
          <div className="flex items-center gap-2" aria-label="Carousel slides">
            {SLIDES.map((s, i) => (
              <button
                key={s.image}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => setIndex(i)}
                className={`h-0.5 rounded-full transition-all ${
                  i === index ? "w-10 bg-white" : "w-6 bg-white/35 hover:bg-white/60"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => go(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 text-white transition hover:border-white hover:bg-white/10"
            >
              <ArrowIcon dir="left" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => go(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 text-white transition hover:border-white hover:bg-white/10"
            >
              <ArrowIcon dir="right" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
