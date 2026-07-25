"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CATEGORY_TILES } from "@/lib/types";
import { DURATION_REVEAL, EASE_REVEAL, STAGGER_CHILD } from "@/lib/motion";

const EASE = EASE_REVEAL;

const gridVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: STAGGER_CHILD, delayChildren: 0.08 },
  },
};

/** Softer power-on: gentle rise + brief bright settle. */
const cardVariants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    filter: "brightness(0.35) saturate(0.45)",
  },
  show: {
    opacity: 1,
    scale: 1,
    filter: [
      "brightness(1.18) saturate(1.12)",
      "brightness(1.18) saturate(1.12)",
      "brightness(1) saturate(1)",
    ],
    transition: {
      opacity: { duration: DURATION_REVEAL, ease: EASE },
      scale: { duration: DURATION_REVEAL, ease: EASE },
      filter: { duration: 0.42, times: [0, 0.35, 1], ease: EASE },
    },
  },
};

const cardVariantsReduced = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: EASE },
  },
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function CategoryCard({
  tile,
  reduce,
}: {
  tile: (typeof CATEGORY_TILES)[number];
  reduce: boolean | null;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const target = useRef({ rx: 0, ry: 0, lift: 0 });
  const current = useRef({ rx: 0, ry: 0, lift: 0 });
  const rafId = useRef(0);
  const hovering = useRef(false);
  const [lit, setLit] = useState(false);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tick = useCallback(() => {
    const node = cardRef.current;
    if (!node) {
      rafId.current = 0;
      return;
    }
    const t = 0.14;
    current.current.rx = lerp(current.current.rx, target.current.rx, t);
    current.current.ry = lerp(current.current.ry, target.current.ry, t);
    current.current.lift = lerp(current.current.lift, target.current.lift, t);

    const { rx, ry, lift } = current.current;
    const settled =
      Math.abs(rx - target.current.rx) < 0.05 &&
      Math.abs(ry - target.current.ry) < 0.05 &&
      Math.abs(lift - target.current.lift) < 0.05;

    if (Math.abs(rx) < 0.02 && Math.abs(ry) < 0.02 && Math.abs(lift) < 0.02 && !hovering.current) {
      node.style.transform = "";
      rafId.current = 0;
      return;
    }

    node.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(${(-lift).toFixed(2)}px)`;

    if (!settled || hovering.current) {
      rafId.current = requestAnimationFrame(tick);
    } else {
      rafId.current = 0;
    }
  }, []);

  const ensureLoop = useCallback(() => {
    if (reduce || rafId.current) return;
    rafId.current = requestAnimationFrame(tick);
  }, [reduce, tick]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (reduce || e.pointerType === "touch") return;
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      target.current = {
        rx: ((y - rect.height / 2) / (rect.height / 2)) * -6,
        ry: ((x - rect.width / 2) / (rect.width / 2)) * 6,
        lift: 6,
      };
      ensureLoop();
    },
    [reduce, ensureLoop],
  );

  const onPointerLeave = useCallback(() => {
    hovering.current = false;
    target.current = { rx: 0, ry: 0, lift: 0 };
    setLit(false);
    ensureLoop();
  }, [ensureLoop]);

  const onPointerEnter = useCallback(
    (e: React.PointerEvent) => {
      hovering.current = true;
      setLit(true);
      if (reduce || e.pointerType === "touch") return;
      target.current.lift = 6;
      ensureLoop();
    },
    [reduce, ensureLoop],
  );

  const onTouchStart = useCallback(() => {
    setLit(true);
    if (touchTimer.current) clearTimeout(touchTimer.current);
    touchTimer.current = setTimeout(() => setLit(false), 1800);
  }, []);

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (touchTimer.current) clearTimeout(touchTimer.current);
    };
  }, []);

  return (
    <motion.div variants={reduce ? cardVariantsReduced : cardVariants} className="h-full">
      <Link
        ref={cardRef}
        href={tile.href}
        className={`shop-cat-card group relative flex h-full min-h-[44px] cursor-pointer flex-col items-center gap-3 rounded-2xl px-3 py-6 text-center will-change-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
          lit ? "is-lit" : ""
        } ${reduce ? "shop-cat-card--reduced" : ""}`}
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onTouchStart={onTouchStart}
      >
        <span className="shop-cat-card__icon relative flex h-[4.25rem] w-[4.25rem] items-center justify-center sm:h-[4.75rem] sm:w-[4.75rem]">
          <Image
            src={tile.image}
            alt=""
            width={76}
            height={76}
            className="shop-cat-card__img relative z-[1] h-full w-full object-contain"
          />
        </span>
        <span className="shop-cat-card__label text-sm font-semibold tracking-tight text-brand-navy">
          {tile.label}
        </span>
      </Link>
    </motion.div>
  );
}

export function ShopByCategory() {
  const reduce = useReducedMotion();

  return (
    <div className="shop-cat relative mt-16 overflow-hidden rounded-3xl border border-brand-border/60 bg-brand-navy/[0.03] px-4 py-12 sm:px-8 sm:py-14">
      <div aria-hidden className="shop-cat__ambient pointer-events-none absolute inset-0">
        <span className="shop-cat__blob shop-cat__blob--a" />
        <span className="shop-cat__blob shop-cat__blob--b" />
        <span className="shop-cat__blob shop-cat__blob--c" />
      </div>

      <div className="relative z-[1]">
        <div className="mx-auto max-w-xl text-center">
          <p className="type-kicker text-brand">Catalog</p>
          <h3 className="type-display mt-3 text-[1.75rem] text-brand-navy sm:text-4xl">
            Shop by Category
          </h3>
          <p className="type-body mt-3 text-brand-muted">
            From bulbs to highbays — tap a category to light the way.
          </p>
        </div>

        <motion.div
          className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          variants={gridVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {CATEGORY_TILES.map((tile) => (
            <CategoryCard key={tile.href + tile.label} tile={tile} reduce={reduce} />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
