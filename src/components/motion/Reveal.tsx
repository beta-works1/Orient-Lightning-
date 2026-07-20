"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  DURATION_PRESS,
  DURATION_REVEAL,
  EASE_HOVER,
  EASE_REVEAL,
  LAYER_HOVER_SCALE,
  LAYER_PRESS_SCALE,
  VIEWPORT_ONCE,
} from "@/lib/motion";

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
      viewport={VIEWPORT_ONCE}
      transition={{
        duration: DURATION_REVEAL,
        delay: Math.min(delay, 0.12),
        ease: EASE_REVEAL,
      }}
    >
      {children}
    </motion.div>
  );
}

/** CTA hover: scale + shadow. Static when reduced-motion. */
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
  const classes = `${className} will-change-transform transition-shadow duration-[var(--motion-hover)] hover:shadow-md`;

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
      whileHover={{ scale: LAYER_HOVER_SCALE }}
      whileTap={{ scale: LAYER_PRESS_SCALE }}
      transition={{ duration: DURATION_PRESS, ease: EASE_HOVER }}
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
  const classes = `${className} will-change-transform transition-shadow duration-[var(--motion-hover)] hover:shadow-md`;

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
      whileHover={disabled ? undefined : { scale: LAYER_HOVER_SCALE }}
      whileTap={disabled ? undefined : { scale: LAYER_PRESS_SCALE }}
      transition={{ duration: DURATION_PRESS, ease: EASE_HOVER }}
    >
      {children}
    </motion.button>
  );
}
