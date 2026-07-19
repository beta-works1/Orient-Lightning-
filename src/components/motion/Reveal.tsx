"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;
const MotionNextLink = motion.create(Link);

/** Scroll reveal — opacity + translateY only, once per element. */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.28, delay: Math.min(delay, 0.12), ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** CTA hover: scale 1.02 (transform) + CSS shadow. Static when reduced-motion. */
export function MotionLink({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const classes = `${className} will-change-transform transition-shadow duration-150 hover:shadow-md`;

  if (reduce) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <MotionNextLink
      href={href}
      className={classes}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.35 }}
    >
      {children}
    </MotionNextLink>
  );
}

export function MotionButton({
  className = "",
  children,
  type = "button",
  disabled,
}: {
  className?: string;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}) {
  const reduce = useReducedMotion();
  const classes = `${className} will-change-transform transition-shadow duration-150 hover:shadow-md`;

  if (reduce) {
    return (
      <button type={type} className={className} disabled={disabled}>
        {children}
      </button>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.35 }}
    >
      {children}
    </motion.button>
  );
}
