"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Reveal } from "@/components/motion/Reveal";

type Stat = {
  value: number;
  suffix?: string;
  label: string;
};

export function AnimatedStats({ stats }: { stats: Stat[] }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nums = root.querySelectorAll<HTMLElement>("[data-count]");

    if (reduce) {
      nums.forEach((el) => {
        el.textContent = el.dataset.count || "0";
      });
      return;
    }

    const animated = new WeakSet<HTMLElement>();

    const run = (el: HTMLElement) => {
      if (animated.has(el)) return;
      animated.add(el);
      const target = Number(el.dataset.count || 0);
      const obj = { n: 0 };
      gsap.to(obj, {
        n: target,
        duration: 1.6,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = String(Math.round(obj.n));
        },
        onComplete: () => {
          el.textContent = String(target);
        },
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) run(entry.target as HTMLElement);
        });
      },
      { threshold: 0.4, rootMargin: "0px 0px -8% 0px" },
    );

    nums.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      nums.forEach((el) => gsap.killTweensOf(el));
    };
  }, [stats]);

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

        <div ref={rootRef} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-7 text-center"
            >
              <div className="font-display text-4xl font-extrabold tabular-nums text-white">
                <span data-count={s.value}>0</span>
                {s.suffix || ""}
              </div>
              <div className="mt-2 text-sm text-white/75">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
