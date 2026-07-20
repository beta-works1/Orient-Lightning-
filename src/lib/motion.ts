/**
 * Shared motion tokens — primed from ui-ux-pro-max Motion-Driven style.
 * No color values here; palette stays in globals.css / tailwind.config.
 */

/** Scroll reveals — soft deceleration */
export const EASE_REVEAL = [0.16, 1, 0.3, 1] as const;

/** Hover / press — slightly snappier */
export const EASE_HOVER = [0.22, 1, 0.36, 1] as const;

/** Motion-Driven style: 300–400ms reveals, 150–250ms micro */
export const DURATION_REVEAL = 0.35;
export const DURATION_HOVER = 0.3;
export const DURATION_PRESS = 0.2;
export const STAGGER_CHILD = 0.1;

export const VIEWPORT_ONCE = { once: true, amount: 0.2 } as const;

/** Parallax layer travel (px) — 3-layer flagship mosaic */
export const PARALLAX = {
  main: [28, -28] as const,
  mid: [40, -12] as const,
  fore: [16, -36] as const,
} as const;

/** Dimensional layering — press/hover scale (no WebGL) */
export const LAYER_HOVER_LIFT = -4;
export const LAYER_HOVER_SCALE = 1.02;
export const LAYER_PRESS_SCALE = 0.97;
