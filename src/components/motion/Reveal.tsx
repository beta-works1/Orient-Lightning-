"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  children: React.ReactNode;
  className?: string;
  y?: number;
  delay?: number;
};

export function Reveal({ children, className = "", y = 16, delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      gsap.set(el, { clearProps: "all", opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0.001, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          delay: Math.min(delay, 0.05),
          ease: "power2.out",
          immediateRender: false,
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
            toggleActions: "play none none none",
            once: true,
          },
        },
      );
    }, el);

    const safety = window.setTimeout(() => {
      if (el && Number.parseFloat(getComputedStyle(el).opacity) < 0.2) {
        gsap.set(el, { opacity: 1, y: 0, clearProps: "transform" });
      }
    }, 800);

    return () => {
      window.clearTimeout(safety);
      ctx.revert();
    };
  }, [y, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
