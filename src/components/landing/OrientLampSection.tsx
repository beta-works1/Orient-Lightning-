"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LampContainer } from "@/components/ui/lamp";

/**
 * Full-bleed brand-story section — dark lamp effect, dual CCT spectrum.
 * Does not replace the existing light homepage hero.
 */
export function OrientLampSection() {
  const reduce = useReducedMotion();

  return (
    <LampContainer>
      <motion.h2
        initial={reduce ? false : { opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={
          reduce ? { duration: 0 } : { delay: 0.3, duration: 0.8, ease: "easeInOut" }
        }
        className="mt-8 bg-gradient-to-br from-white to-blue-100 bg-clip-text py-4 text-center font-display text-4xl font-extrabold tracking-tight text-transparent md:text-6xl lg:text-7xl"
      >
        Light, Engineered. <br /> Since 1996.
      </motion.h2>
      <motion.p
        initial={reduce ? false : { opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={
          reduce ? { duration: 0 } : { delay: 0.5, duration: 0.8, ease: "easeInOut" }
        }
        className="mt-4 max-w-lg text-center text-sm text-slate-300 md:text-base"
      >
        Residential, commercial and industrial LED lighting from Photon Electric Pvt Ltd — trusted
        by homes, offices and institutions across Pakistan.
      </motion.p>
    </LampContainer>
  );
}
