"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_REVEAL, STAGGER_CHILD, VIEWPORT_ONCE, DURATION_REVEAL } from "@/lib/motion";

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

const container = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER_CHILD } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION_REVEAL, ease: EASE_REVEAL },
  },
};

export function SpaceCards() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="mt-12 grid gap-4 sm:grid-cols-3"
      variants={reduce ? undefined : container}
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "show"}
      viewport={VIEWPORT_ONCE}
    >
      {SPACES.map((cat) => (
        <motion.div key={cat.href} variants={reduce ? undefined : item}>
          <Link
            href={cat.href}
            className="group flex min-h-[44px] cursor-pointer flex-col rounded-2xl border border-brand-border bg-white p-6 shadow-sm transition-shadow duration-200 hover:border-brand hover:shadow-bloom focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.99]"
          >
            <div className="mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-brand-off">
              <Image
                src={cat.image}
                alt=""
                width={48}
                height={48}
                className="h-10 w-10 object-contain transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
              />
            </div>
            <h3 className="type-title text-brand-navy group-hover:text-brand">{cat.title}</h3>
            <p className="type-caption mt-2 flex-1 text-brand-muted">{cat.blurb}</p>
            <span className="mt-5 text-sm font-semibold text-brand">Explore Range →</span>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
