"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";

const STORAGE_KEY = "orient-intro-seen";

type Phase = "show" | "exit" | "ready";

/** Nudge Framer scroll observers after intro unlocks the page. */
function refreshScrollMotion() {
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
  });
}

function finishIntro(setPhase: (p: Phase) => void) {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
  document.documentElement.classList.remove("intro-pending");
  setPhase("ready");
  refreshScrollMotion();
}

function shouldSkipIntro() {
  try {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return true;
    if (new URLSearchParams(window.location.search).get("skipIntro") === "1") return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function IntroGate({ children }: { children: ReactNode }) {
  // Default to ready so a failed/slow hydrate never blanks the storefront.
  const [phase, setPhase] = useState<Phase>("ready");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (shouldSkipIntro()) {
      document.documentElement.classList.remove("intro-pending");
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      setPhase("ready");
      return;
    }

    document.documentElement.classList.add("intro-pending");
    setPhase("show");

    const exitTimer = window.setTimeout(() => setPhase("exit"), 1400);
    const doneTimer = window.setTimeout(() => finishIntro(setPhase), 2000);

    const safety = window.setTimeout(() => finishIntro(setPhase), 2800);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
      window.clearTimeout(safety);
      document.documentElement.classList.remove("intro-pending");
    };
  }, []);

  const showSplash = mounted && (phase === "show" || phase === "exit");

  return (
    <>
      {showSplash ? (
        <div
          className={`intro-splash fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand-navy ${
            phase === "exit" ? "intro-splash--exit" : ""
          }`}
          role="presentation"
          aria-hidden={phase === "exit"}
        >
          <div className="intro-splash__glow" />
          <div className="intro-splash__mark">
            <BrandLogo variant="mark" priority className="intro-splash__mark-img" />
          </div>
          <div className="intro-splash__wordmark mt-6">
            <BrandLogo variant="splash" priority />
          </div>
          <p className="intro-splash__tag mt-4 text-xs uppercase tracking-[0.35em] text-white/70">
            Lighting Pakistan since 1996
          </p>
          <div className="intro-splash__beam" />
        </div>
      ) : null}

      {/* Site stays in the tree and interactive — splash only overlays */}
      <div className="site-shell site-shell--visible">{children}</div>
    </>
  );
}
