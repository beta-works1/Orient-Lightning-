"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MotionLink } from "@/components/motion/Reveal";
import { EASE_REVEAL } from "@/lib/motion";

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
    title: "STREET LIGHT THAT PERFORM.",
    description: "Reliable LED street lights engineered for roads and outdoor sites.",
    href: "/collections/street-light",
    image: "/images/promo/industrial-2.jpg",
    cta: "Explore Street Light",
  },
] as const;

const EASE = EASE_REVEAL;
const CROSSFADE_MS = 1.1;

function HeroTitle({ text, reduce }: { text: string; reduce: boolean | null }) {
  const words = text.split(/\s+/);
  return (
    <h1 className="font-display text-[2.35rem] font-extrabold uppercase leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-[4.25rem]">
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="mr-[0.28em] inline-block last:mr-0"
          initial={reduce ? false : { opacity: 0, clipPath: "inset(0 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
          transition={{
            duration: reduce ? 0 : 0.42,
            delay: reduce ? 0 : 0.12 + i * 0.07,
            ease: EASE,
          }}
        >
          {word}
        </motion.span>
      ))}
    </h1>
  );
}

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
  const fade = reduce ? 0 : CROSSFADE_MS;

  const go = useCallback((dir: -1 | 1) => {
    setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => go(1), 7000);
    return () => window.clearInterval(id);
  }, [reduce, go, index]);

  const slide = SLIDES[index];

  return (
    <section className="relative h-[100svh] min-h-[560px] max-h-[960px] overflow-hidden bg-brand-navy text-white">
      {/* Crossfade stack — outgoing slide stays visible while the next fades in */}
      <div className="absolute inset-0">
        {SLIDES.map((s, i) => {
          const active = i === index;
          return (
            <motion.div
              key={s.image}
              className="absolute inset-0"
              initial={false}
              animate={{
                opacity: active ? 1 : 0,
                scale: active && !reduce ? 1.04 : 1,
              }}
              transition={{
                opacity: { duration: fade, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: reduce ? 0 : 7, ease: "linear" },
              }}
              style={{ zIndex: active ? 2 : 1, pointerEvents: active ? "auto" : "none" }}
              aria-hidden={!active}
            >
              <Image
                src={s.image}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                quality={90}
                className="object-cover object-center"
              />
            </motion.div>
          );
        })}
        <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
        <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-black/50 via-transparent to-black/25" />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-28 pt-28 sm:pb-32 lg:justify-center lg:pb-28 lg:pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.title}
            className="max-w-2xl"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}
          >
            <HeroTitle text={slide.title} reduce={reduce} />
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.35, ease: EASE }}
              className="mt-5 max-w-md text-base text-white/90 sm:text-lg"
            >
              {slide.description}
            </motion.p>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : 0.5, ease: EASE }}
              className="mt-8"
            >
              <MotionLink
                href={slide.href}
                className="inline-flex rounded-full bg-brand px-7 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-sm transition-shadow duration-150 hover:bg-white hover:text-brand hover:shadow-md"
              >
                {slide.cta}
              </MotionLink>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

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
                className={`h-0.5 rounded-full transition-all duration-500 ease-out ${
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
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 text-white transition duration-150 hover:border-white hover:bg-white/10 active:scale-95"
            >
              <ArrowIcon dir="left" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => go(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 text-white transition duration-150 hover:border-white hover:bg-white/10 active:scale-95"
            >
              <ArrowIcon dir="right" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
