"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Props = {
  images: string[];
  alt?: string;
  intervalMs?: number;
};

export function PromoImageSlider({ images, alt = "", intervalMs = 3800 }: Props) {
  const reduce = useReducedMotion();
  const unique = Array.from(new Set(images.filter(Boolean)));
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (reduce || unique.length < 2) return;
    const id = window.setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % unique.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [reduce, unique.length, intervalMs]);

  if (!unique.length) return null;

  const goTo = (next: number) => {
    setDirection(next > index || (index === unique.length - 1 && next === 0) ? 1 : -1);
    setIndex(next);
  };

  return (
    <div className="mt-5">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-black/20 ring-1 ring-white/20">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={unique[index]}
            custom={direction}
            className="absolute inset-0"
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? -32 : 32 }}
            transition={{ duration: reduce ? 0.2 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={unique[index]}
              alt={alt}
              fill
              sizes="(max-width:1024px) 90vw, 30vw"
              quality={90}
              className="object-cover"
              priority={index === 0}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {unique.length > 1 ? (
        <div className="mt-2.5 flex items-center justify-center gap-2">
          {unique.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
