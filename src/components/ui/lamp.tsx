"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

// Orient Lighting brand tokens:
// Filament Amber (warm, 2700K) → #FFB84D
// Signature Blue, brightened for glow on dark bg → #2F6FE0
// (Base #0F428F is too dark to read as a glow on near-black.)

export function LampContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div
      className={cn(
        "relative z-0 flex min-h-[70vh] w-full flex-col items-center justify-center overflow-hidden rounded-none bg-[#070B1A] sm:min-h-[75vh]",
        className,
      )}
    >
      <div className="relative isolate z-0 flex w-full flex-1 scale-y-125 items-center justify-center">
        {/* Warm cone — amber, 2700K */}
        <motion.div
          initial={reduce ? false : { opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          viewport={{ once: true, amount: 0.4 }}
          transition={
            reduce ? { duration: 0 } : { delay: 0.3, duration: 0.8, ease: "easeInOut" }
          }
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto right-1/2 h-56 w-[30rem] overflow-visible bg-gradient-conic from-[#FFB84D] via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
        >
          <div className="absolute bottom-0 left-0 z-20 h-40 w-[100%] bg-[#070B1A] [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute bottom-0 left-0 z-20 h-[100%] w-40 bg-[#070B1A] [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>

        {/* Cool cone — blue, 6500K */}
        <motion.div
          initial={reduce ? false : { opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          viewport={{ once: true, amount: 0.4 }}
          transition={
            reduce ? { duration: 0 } : { delay: 0.3, duration: 0.8, ease: "easeInOut" }
          }
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-[#2F6FE0] text-white [--conic-position:from_290deg_at_center_top]"
        >
          <div className="absolute bottom-0 right-0 z-20 h-[100%] w-40 bg-[#070B1A] [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute bottom-0 right-0 z-20 h-40 w-[100%] bg-[#070B1A] [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>

        <div className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-[#070B1A] blur-2xl" />
        <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md" />

        <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-gradient-to-r from-[#FFB84D] to-[#2F6FE0] opacity-40 blur-3xl" />

        <motion.div
          initial={reduce ? false : { width: "8rem" }}
          whileInView={{ width: "16rem" }}
          viewport={{ once: true, amount: 0.4 }}
          transition={
            reduce ? { duration: 0 } : { delay: 0.3, duration: 0.8, ease: "easeInOut" }
          }
          className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full bg-gradient-to-r from-[#FFB84D] to-[#2F6FE0] blur-2xl"
        />

        <motion.div
          initial={reduce ? false : { width: "15rem" }}
          whileInView={{ width: "30rem" }}
          viewport={{ once: true, amount: 0.4 }}
          transition={
            reduce ? { duration: 0 } : { delay: 0.3, duration: 0.8, ease: "easeInOut" }
          }
          className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] bg-gradient-to-r from-[#FFB84D] via-white to-[#2F6FE0]"
        />

        <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-[#070B1A]" />
      </div>

      <div className="relative z-50 flex -translate-y-80 flex-col items-center px-5">
        {children}
      </div>
    </div>
  );
}
