"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";
import { EASE_REVEAL, DURATION_REVEAL } from "@/lib/motion";

type Stat = {
  value: number;
  suffix?: string;
  label: string;
};

function CountCell({ value, suffix, reduce }: { value: number; suffix?: string; reduce: boolean | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    let start: number | null = null;
    const duration = 1600;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - (1 - p) ** 3;
      setDisplay(Math.round(value * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix || ""}
    </span>
  );
}

export function AnimatedStats({ stats }: { stats: Stat[] }) {
  const reduce = useReducedMotion();

  return (
    <section className="bg-brand-navy py-16 text-white sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Since 1996</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Quality without compromise
            </h2>
            <p className="mt-4 text-sm text-white/70 sm:text-base">
              Real numbers from this storefront — years in market, live catalog SKUs, and the client
              marks we feature.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: reduce ? 0 : i * 0.08, duration: DURATION_REVEAL, ease: EASE_REVEAL }}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-7 text-center"
            >
              <div className="font-display text-4xl font-extrabold text-white">
                <CountCell value={s.value} suffix={s.suffix} reduce={reduce} />
              </div>
              <div className="mt-2 text-sm text-white/75">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
