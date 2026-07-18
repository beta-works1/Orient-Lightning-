"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";

type Space = "home" | "office" | "warehouse";
type Size = "small" | "medium" | "large";
type Priority = "brightness" | "energy" | "aesthetics";

const SPACE_OPTS: { id: Space; label: string; hint: string }[] = [
  { id: "home", label: "Home", hint: "Living rooms, kitchens, bedrooms" },
  { id: "office", label: "Office / Shop", hint: "Workspaces, retail, hospitality" },
  { id: "warehouse", label: "Warehouse / Site", hint: "Industrial halls, yards, roads" },
];

const SIZE_OPTS: { id: Size; label: string }[] = [
  { id: "small", label: "Compact" },
  { id: "medium", label: "Standard" },
  { id: "large", label: "Large / open" },
];

const PRIORITY_OPTS: { id: Priority; label: string }[] = [
  { id: "brightness", label: "Maximum brightness" },
  { id: "energy", label: "Energy saving" },
  { id: "aesthetics", label: "Clean aesthetics" },
];

function recommend(space: Space, size: Size, priority: Priority) {
  if (space === "warehouse") {
    if (size === "large" || priority === "brightness") {
      return {
        title: "Highbay & Flood Lights",
        body: "High-output luminaires for halls, yards and industrial spans.",
        href: "/collections/highbay-lights",
        altHref: "/collections/flood-lights",
        altLabel: "Browse flood lights",
      };
    }
    return {
      title: "Street & Outdoor",
      body: "Durable outdoor lighting for compounds, roads and façades.",
      href: "/collections/street-light",
      altHref: "/collections/flood-lights",
      altLabel: "Browse flood lights",
    };
  }

  if (space === "office") {
    if (priority === "aesthetics") {
      return {
        title: "LED Panels",
        body: "Even, glare-controlled panels for offices, shops and lobbies.",
        href: "/collections/led-recessed-surface-panels",
        altHref: "/collections/downlights",
        altLabel: "See downlights",
      };
    }
    return {
      title: "Commercial Lighting",
      body: "A full commercial suite — panels, battens and outdoor options.",
      href: "/collections/commercial-lighting",
      altHref: "/collections/battens-tube-lights",
      altLabel: "See battens",
    };
  }

  // home
  if (priority === "energy" || size === "small") {
    return {
      title: "LED Bulbs",
      body: "Efficient Carol-series bulbs with warm-to-daylight CCT choices.",
      href: "/collections/bulbs",
      altHref: "/collections/downlights",
      altLabel: "See downlights",
    };
  }
  if (priority === "aesthetics") {
    return {
      title: "Downlights & Panels",
      body: "Clean recessed and surface lighting for modern interiors.",
      href: "/collections/downlights",
      altHref: "/collections/led-recessed-surface-panels",
      altLabel: "See panels",
    };
  }
  return {
    title: "Residential Lighting",
    body: "Bulbs, downlights, battens and panels for every room.",
    href: "/collections/residential-lighting",
    altHref: "/collections/best-sellers",
    altLabel: "Best sellers",
  };
}

export function FindYourFit() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [space, setSpace] = useState<Space | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);

  const result = useMemo(() => {
    if (!space || !size || !priority) return null;
    return recommend(space, size, priority);
  }, [space, size, priority]);

  const reset = () => {
    setStep(0);
    setSpace(null);
    setSize(null);
    setPriority(null);
  };

  return (
    <section className="bg-brand-paper py-16 sm:py-24" id="find-your-fit">
      <div className="mx-auto max-w-7xl px-4">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Find your fit</p>
            <h2 className="mt-3 text-balance font-display text-[1.65rem] font-extrabold leading-tight tracking-tight text-brand-navy sm:text-5xl">
              Three questions. One clear recommendation.
            </h2>
            <p className="mt-4 text-sm text-brand-muted sm:text-base">
              Real category links from our catalog — not a gimmick. Answer, then shop the match.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto mt-10 max-w-3xl">
          <div className="rounded-3xl border border-brand-border bg-white p-6 shadow-bloom sm:p-8">
            <div className="mb-6 flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-brand-ice"}`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 0 ? (
                <motion.div
                  key="space"
                  initial={reduce ? false : { opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? undefined : { opacity: 0, x: -16 }}
                >
                  <h3 className="font-display text-xl font-bold text-brand-navy">1. What space are you lighting?</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {SPACE_OPTS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSpace(opt.id);
                          setStep(1);
                        }}
                        className={`rounded-2xl border p-4 text-left transition hover:border-brand ${
                          space === opt.id ? "border-brand bg-brand-ice" : "border-brand-border"
                        }`}
                      >
                        <div className="font-semibold text-brand-navy">{opt.label}</div>
                        <div className="mt-1 text-xs text-brand-muted">{opt.hint}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : null}

              {step === 1 ? (
                <motion.div
                  key="size"
                  initial={reduce ? false : { opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? undefined : { opacity: 0, x: -16 }}
                >
                  <h3 className="font-display text-xl font-bold text-brand-navy">2. How large is the area?</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {SIZE_OPTS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSize(opt.id);
                          setStep(2);
                        }}
                        className={`rounded-2xl border p-4 text-left font-semibold text-brand-navy transition hover:border-brand ${
                          size === opt.id ? "border-brand bg-brand-ice" : "border-brand-border"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="mt-4 text-sm text-brand hover:underline" onClick={() => setStep(0)}>
                    ← Back
                  </button>
                </motion.div>
              ) : null}

              {step === 2 && !result ? (
                <motion.div
                  key="priority"
                  initial={reduce ? false : { opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? undefined : { opacity: 0, x: -16 }}
                >
                  <h3 className="font-display text-xl font-bold text-brand-navy">3. What matters most?</h3>
                  <div className="mt-4 grid gap-3">
                    {PRIORITY_OPTS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setPriority(opt.id);
                          setStep(3);
                        }}
                        className="rounded-2xl border border-brand-border p-4 text-left font-semibold text-brand-navy transition hover:border-brand hover:bg-brand-ice"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="mt-4 text-sm text-brand hover:underline" onClick={() => setStep(1)}>
                    ← Back
                  </button>
                </motion.div>
              ) : null}

              {step === 3 && result ? (
                <motion.div
                  key="result"
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">Your match</p>
                  <h3 className="mt-2 font-display text-3xl font-extrabold text-brand-navy">{result.title}</h3>
                  <p className="mt-3 text-sm text-brand-muted">{result.body}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={result.href}
                      className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy"
                    >
                      Shop this category
                    </Link>
                    <Link
                      href={result.altHref}
                      className="rounded-full border border-brand px-5 py-2.5 text-sm font-semibold text-brand hover:bg-brand-ice"
                    >
                      {result.altLabel}
                    </Link>
                    <button
                      type="button"
                      onClick={reset}
                      className="rounded-full px-5 py-2.5 text-sm font-semibold text-brand-muted hover:text-brand"
                    >
                      Start over
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
