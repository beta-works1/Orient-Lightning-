"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { DURATION_REVEAL, EASE_REVEAL } from "@/lib/motion";

const STEPS = [
  { n: "1", t: "Pick a category" },
  { n: "2", t: "Compare options" },
  { n: "3", t: "Get matched" },
] as const;

export function CompareSteps() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.45"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0, 1]);

  return (
    <div ref={ref} className="relative mt-6">
      <div className="pointer-events-none absolute left-[16.67%] right-[16.67%] top-4 hidden h-0.5 overflow-hidden sm:block">
        <motion.div
          style={{ scaleX: lineScale, transformOrigin: "0% 50%" }}
          className="h-full w-full bg-gradient-to-r from-white/20 via-white/70 to-white/20"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.n}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: reduce ? 0 : i * 0.12, duration: DURATION_REVEAL, ease: EASE_REVEAL }}
            className="relative rounded-2xl border border-white/10 bg-brand-navy/40 p-4 text-center"
          >
            <div className="relative z-[1] mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              {step.n}
            </div>
            <p className="relative z-[1] mt-2 text-xs font-medium text-white/85">{step.t}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
