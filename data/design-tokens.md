# Orient Lighting — Design Tokens (extracted from live site)

Source: https://orientlighting.com.pk homepage HTML / CSS (2026-07-17)

## Brand colors
- Primary / theme-color / announcement bar bg: `#0f428f`
- Announcement bar text: `#ffffff`
- Deep navy (seen in theme): `#162950`
- Body/dark text: `#343538`
- Danger/sale red: `#f12a2a`
- Sample/muted: `#5d6b82`
- Border: `#d1d5db`
- Accent CSS var `--ecom-global-colors-kIdpYIOn`: `#0f428f`

## Fonts (Google Fonts)
- **Montserrat** — primary UI / body (weights 100–900 available; site uses 400+)
- **Oswald** — display/headings (400, 600)
- **Roboto** — secondary body
- Also loaded: Playfair Display, Lato (may be unused)

Google Fonts URL pattern includes:
`family=Montserrat` + `Oswald:wght@400;600` + `Roboto` + `Playfair+Display` + `Lato`

## Announcement bar
Exact copy: `Online Orders Are Currently Not Available. Kindly Contact us on WhatsApp for Queries.`
Background: `#0f428f`, text white

## OG image / logo candidate
`https://cdn.shopify.com/s/files/1/0333/6745/7925/files/IMG_5134.png`

## WhatsApp
`https://wa.me/923001674368`

## Tailwind mapping suggestion
```js
colors: {
  brand: {
    DEFAULT: '#0f428f',
    navy: '#162950',
    dark: '#343538',
    muted: '#5d6b82',
    sale: '#f12a2a',
  }
}
fontFamily: {
  sans: ['Montserrat', 'sans-serif'],
  display: ['Oswald', 'sans-serif'],
  body: ['Roboto', 'sans-serif'],
}
```
