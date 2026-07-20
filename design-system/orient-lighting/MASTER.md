# Orient Lighting — Design System Master

> Craft rules from **ui-ux-pro-max**. Colors and direction are locked to the
> established Orient brand — do **not** apply the skill’s generic e-commerce greens.

## Brand colors (source of truth)

| Token | Hex | Use |
|---|---|---|
| Signature Blue | `#0F428F` | Primary CTAs, links, focus rings |
| Navy | `#162950` | Dark sections, hero overlays |
| Dark | `#343538` | Body text |
| Muted | `#5D6B82` | Secondary copy |
| Border | `#D1D5DB` | Card/grid borders |
| Off / Ice | `#F8FAFC` | Light section backgrounds |
| Sale | `#F12A2A` | Sale badges only |

## Typography

- **Display:** Syne (extrabold) — heroes, section titles
- **Body / UI:** DM Sans
- **Specs:** JetBrains Mono (wattage, Kelvin)
- Scale utilities: `.type-display` · `.type-title` · `.type-body` · `.type-caption` · `.type-kicker`

## Spacing

- Homepage sections: `.section-space` → `py-16 / sm:py-20 / lg:py-24`
- Card grids: `gap-3` mobile, `gap-4` desktop
- Touch targets: minimum **44×44px**

## Cards & interaction

- Product cards: `rounded-2xl`, `border-brand-border`, `.elev-card` dimensional layering (shadow depth, not WebGL)
- `cursor-pointer` on every interactive control
- Transitions use motion tokens: `--motion-reveal` (350ms), `--motion-hover` (300ms), `--motion-press` (200ms)
- Respect `prefers-reduced-motion`
- Visible `focus-visible` ring using Signature Blue

## Motion primer (ui-ux-pro-max — colors still locked)

Three patterns baked into `src/lib/motion.ts` + CSS `:root` tokens:

| Pattern | Source search | Orient implementation |
|---|---|---|
| **Motion-Driven scroll reveal** | `motion driven scroll reveal` | `whileInView` + `VIEWPORT_ONCE`, 350ms, `transform`/`opacity` only, parallax on flagships (`PARALLAX` constants) |
| **Micro-interactions** | `micro-interactions hover state` | 300ms hovers, 200ms press (`LAYER_PRESS_SCALE`), `MotionLink`/`CompareToggle` tactile states |
| **Dimensional layering** | `3d product preview` (lighter alt) | `.elev-card` elevation shadows + image crossfade on product cards — no Three.js / `model-viewer` |

Do **not** swap palette from skill rows. Pull timing, easing, and interaction patterns only.

## Anti-patterns (from skill — still apply)

- No emoji-as-icons
- No text-only category rows when icons exist
- No fabricated trust credentials
- No fake countdown stuck at zero — omit Daily Deal unless a real promo exists
- Do not replace brand blues with skill-suggested emerald/orange palettes
