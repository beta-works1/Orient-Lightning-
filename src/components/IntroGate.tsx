"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";

const STORAGE_KEY = "orient-intro-seen";

type Phase = "pending" | "show" | "exit" | "ready";

export function IntroGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("pending");

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      seen = false;
    }

    if (seen) {
      document.documentElement.classList.remove("intro-pending");
      setPhase("ready");
      return;
    }

    document.documentElement.classList.add("intro-pending");
    setPhase("show");

    const exitTimer = window.setTimeout(() => setPhase("exit"), 2400);
    const doneTimer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      document.documentElement.classList.remove("intro-pending");
      setPhase("ready");
    }, 3200);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  const showSplash = phase === "pending" || phase === "show" || phase === "exit";
  const showSite = phase === "ready";

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
          {phase !== "pending" ? (
            <>
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
            </>
          ) : null}
        </div>
      ) : null}

      <div
        className={`site-shell ${showSite ? "site-shell--visible" : "site-shell--hidden"}`}
        aria-hidden={!showSite}
      >
        {children}
      </div>
    </>
  );
}
