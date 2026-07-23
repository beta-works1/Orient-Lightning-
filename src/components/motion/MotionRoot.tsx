"use client";

import { useEffect } from "react";

/** Native scroll only — GSAP ScrollTrigger loads on demand to keep first paint light. */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cancelled = false;
    let refresh: (() => void) | null = null;
    let killAll: (() => void) | null = null;
    let timer = 0;

    (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      refresh = () => ScrollTrigger.refresh();
      killAll = () => ScrollTrigger.getAll().forEach((st) => st.kill());
      timer = window.setTimeout(refresh, 300);
      window.addEventListener("load", refresh);
    })();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      if (refresh) window.removeEventListener("load", refresh);
      killAll?.();
    };
  }, []);

  return <>{children}</>;
}
