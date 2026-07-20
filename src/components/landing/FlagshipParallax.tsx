"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { MotionLink } from "@/components/motion/Reveal";
import { PARALLAX } from "@/lib/motion";

type Flagship = {
  eyebrow: string;
  title: string;
  body: string;
  tags: readonly string[];
  href: string;
  secondaryHref: string;
  secondaryLabel: string;
  images: readonly [string, string];
  reverse: boolean;
};

function ParallaxMosaic({ images }: { images: readonly [string, string] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const yMain = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [...PARALLAX.main]);
  const yTop = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [...PARALLAX.mid]);
  const yBottom = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [...PARALLAX.fore]);

  return (
    <div
      ref={ref}
      className="grid min-h-[280px] grid-cols-2 grid-rows-2 gap-2 p-2 sm:min-h-[360px] sm:gap-3 sm:p-3"
    >
      <motion.div style={{ y: yMain }} className="relative row-span-2 overflow-hidden rounded-2xl">
        <Image src={images[0]} alt="" fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover" />
      </motion.div>
      <motion.div style={{ y: yTop }} className="relative overflow-hidden rounded-2xl">
        <Image
          src={images[1]}
          alt=""
          fill
          sizes="(max-width:1024px) 50vw, 25vw"
          className="object-cover object-center"
        />
      </motion.div>
      <motion.div style={{ y: yBottom }} className="relative overflow-hidden rounded-2xl">
        <Image
          src={images[1]}
          alt=""
          fill
          sizes="(max-width:1024px) 50vw, 25vw"
          className="object-cover object-bottom"
        />
      </motion.div>
    </div>
  );
}

export function FlagshipParallax({ item }: { item: Flagship }) {
  return (
    <article
      className={`grid items-center gap-8 overflow-hidden rounded-3xl border border-brand-border bg-brand-off lg:grid-cols-2 lg:gap-0 ${
        item.reverse ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      <ParallaxMosaic images={item.images} />
      <div className="p-8 sm:p-10 lg:p-12">
        <p className="type-kicker text-brand">{item.eyebrow}</p>
        <h3 className="type-display mt-3 text-[1.75rem] text-brand-navy sm:text-4xl">{item.title}</h3>
        <p className="type-body mt-4 text-brand-muted">{item.body}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-brand/20 bg-white px-3 py-1 text-xs font-medium text-brand"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <MotionLink
            href={item.href}
            className="inline-flex min-h-[44px] cursor-pointer items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-navy"
          >
            Shop Now
          </MotionLink>
          <MotionLink
            href={item.secondaryHref}
            className="inline-flex min-h-[44px] cursor-pointer items-center rounded-full border border-brand/30 px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-white"
          >
            {item.secondaryLabel}
          </MotionLink>
        </div>
      </div>
    </article>
  );
}
