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

- Product cards: `rounded-2xl`, `border-brand-border`, `hover:shadow-bloom`, bloom glow on hover
- `cursor-pointer` on every interactive control
- Transitions 150–300ms; respect `prefers-reduced-motion`
- Visible `focus-visible` ring using Signature Blue

## Anti-patterns (from skill — still apply)

- No emoji-as-icons
- No text-only category rows when icons exist
- No fabricated trust credentials
- No fake countdown stuck at zero — omit Daily Deal unless a real promo exists
- Do not replace brand blues with skill-suggested emerald/orange palettes
