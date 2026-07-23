"use client";

import { cn } from "@/lib/utils";

/**
 * Orbit loader inspired by 21st.dev / community spinner patterns
 * (Tailwind + CSS keyframes, no external registry auth required).
 */
export function AnimatedLoader({
  className,
  label = "Loading",
  size = "md",
}: {
  className?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-11 w-11";

  return (
    <div
      className={cn("inline-flex flex-col items-center justify-center gap-3", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className={cn("relative", dim)}>
        <span className="absolute inset-0 animate-[admin-orbit_1.1s_linear_infinite] rounded-full border-2 border-transparent border-t-white/90 border-r-white/40" />
        <span className="absolute inset-1.5 animate-[admin-orbit_0.85s_linear_infinite_reverse] rounded-full border-2 border-transparent border-b-[#5B9CFF] border-l-[#5B9CFF]/70" />
        <span className="absolute inset-[38%] animate-pulse rounded-full bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.55)]" />
      </div>
      {size !== "sm" ? (
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/75">{label}</p>
      ) : null}
    </div>
  );
}

/** Compact inline spinner for buttons / table actions */
export function InlineSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent",
        className,
      )}
      aria-hidden
    />
  );
}

/** Full-viewport overlay used during route transitions */
export function AdminLoadingOverlay({ label = "Loading" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0B1C33]/55 backdrop-blur-[2px]">
      <div className="rounded-2xl border border-white/15 bg-[#0F428F]/35 px-8 py-7 shadow-2xl shadow-black/30">
        <AnimatedLoader label={label} size="lg" />
      </div>
    </div>
  );
}
