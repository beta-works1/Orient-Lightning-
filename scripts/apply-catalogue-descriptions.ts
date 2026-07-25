/**
 * Applies Orient Lighting Catalogue 2026-27 specs as HTML product descriptions.
 * Source: public/orient-lighting-catalogue.pdf (OCR + page review).
 *
 * Usage: npx tsx scripts/apply-catalogue-descriptions.ts
 */
import { readFileSync, writeFileSync } from "fs";
import path from "path";

type SpecRow = {
  model?: string;
  watts: string;
  lumens: string;
  notes?: string;
};

type CatalogueEntry = {
  series: string;
  blurb: string;
  specs: SpecRow[];
  features: string[];
  applications: string[];
  electrical: string[];
  warranty?: string;
  sourcePage: string;
};

const root = process.cwd();

function tableHtml(rows: SpecRow[]) {
  const head = `<tr><th>Model</th><th>Watts</th><th>Lumens</th><th>Notes</th></tr>`;
  const body = rows
    .map(
      (r) =>
        `<tr><td>${r.model || "—"}</td><td>${r.watts}</td><td>${r.lumens}</td><td>${r.notes || "—"}</td></tr>`,
    )
    .join("");
  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function toHtml(e: CatalogueEntry) {
  return [
    `<p><strong>${e.series}</strong> — from Orient Lighting Catalogue 2026–27 (${e.sourcePage}).</p>`,
    `<p>${e.blurb}</p>`,
    `<p><strong>Catalogue specifications</strong></p>`,
    tableHtml(e.specs),
    e.features.length
      ? `<p><strong>Features</strong></p><ul>${e.features.map((f) => `<li>${f}</li>`).join("")}</ul>`
      : "",
    e.electrical.length
      ? `<p><strong>Electrical & performance</strong></p><ul>${e.electrical.map((f) => `<li>${f}</li>`).join("")}</ul>`
      : "",
    e.applications.length
      ? `<p><strong>Applications</strong></p><p>${e.applications.join(", ")}</p>`
      : "",
    e.warranty ? `<p><strong>Warranty:</strong> ${e.warranty}</p>` : "",
    `<p><em>Specs sourced from the official Orient Lighting product catalogue PDF.</em></p>`,
  ]
    .filter(Boolean)
    .join("\n");
}

const CATALOGUE: Record<string, CatalogueEntry> = {
  "ol-12-watt-candy-led-bulbs-cp-67": {
    series: "Carol Series LED Bulbs",
    sourcePage: "p.4",
    blurb:
      "A-shape LED bulbs for everyday residential and light commercial use, available in warm, natural and daylight colour temperatures.",
    specs: [
      { model: "OL-BA03C", watts: "3W", lumens: "285 lm", notes: "60×112 mm · CCT 3000/4000/6500K" },
      { model: "OL-BA12C", watts: "12W", lumens: "1140 lm", notes: "65×117 mm · CCT 3000/4000/6500K" },
      { model: "OL-BA18C", watts: "18W", lumens: "1710 lm", notes: "80×152 mm · CCT 3000/4000/6500K" },
      { model: "OL-BA24C", watts: "24W", lumens: "2280 lm", notes: "95×164 mm · CCT 3000/4000/6500K" },
    ],
    features: ["Wide 270° beam", "Qty/ctn 50", "Indoor A-series form factor"],
    applications: ["Home", "Shop", "Office", "Restaurant"],
    electrical: ["PF 0.5", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 25,000 H", "Voltage 85–256V"],
    warranty: "1 year",
  },
  "gv-30-watt-t-series-led-bulbs-t-80": {
    series: "T-Series High Power Bulbs (Blaze)",
    sourcePage: "p.5",
    blurb:
      "High-output T-shape LED bulbs with E27/B22 bases for bright general lighting in homes and commercial spaces.",
    specs: [
      { model: "OL-HP25T", watts: "25W", lumens: "2375 lm", notes: "T80 · 80×139 mm" },
      { model: "OL-HP35T", watts: "35W", lumens: "3325 lm", notes: "T100 · 100×176 mm" },
      { model: "OL-HP45T", watts: "45W", lumens: "4275 lm", notes: "T120 · 120×205 mm" },
      { model: "OL-HP55T", watts: "55W", lumens: "5225 lm", notes: "T140 · 140×252 mm" },
    ],
    features: ["E27 / B22 base", "CCT 3000/4000/6500K", "220° beam"],
    applications: ["Home", "Shop", "Office", "Restaurant"],
    electrical: ["PF 0.5", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 25,000 H", "Voltage 85–256V"],
    warranty: "1 year",
  },
  "ol-7-watt-blue-moon-smd-round": {
    series: "Blue Moon Downlights (SMD)",
    sourcePage: "p.6",
    blurb: "Recessed Blue Moon SMD/COB downlights for shops, hospitality and lobbies.",
    specs: [
      { model: "OL-DL07LS", watts: "7W", lumens: "560 lm", notes: "Hole Ø90 mm · 120°" },
      { model: "OL-DL12LS", watts: "12W", lumens: "960 lm", notes: "Hole Ø90 mm · 120°" },
      { model: "OL-DL12LS6", watts: "12W", lumens: "960 lm", notes: "Hole Ø150 mm · 120°" },
      { model: "OL-DL18LS", watts: "18W", lumens: "1440 lm", notes: "Hole Ø200 mm · 120°" },
    ],
    features: ["SMD / COB options", "CCT 2700/4000/6500K"],
    applications: ["Shop", "Restaurant", "Hotel", "Museum", "Lobby"],
    electrical: ["PF 0.6", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 25,000 H", "Voltage 85–256V"],
    warranty: "1 year",
  },
  "ol-7-watt-blue-moon-cob-round-rt": {
    series: "Blue Moon Rotateable COB",
    sourcePage: "p.6",
    blurb: "Blue Moon COB recessed downlight with rotatable aiming for accent and general lighting.",
    specs: [
      { model: "OL-DL07LS", watts: "7W", lumens: "560 lm", notes: "SMD/COB · 120°" },
      { model: "OL-DL12LS", watts: "12W", lumens: "960 lm", notes: "SMD/COB · 120°" },
      { model: "OL-DL18LS", watts: "18W", lumens: "1440 lm", notes: "SMD/COB · 120°" },
    ],
    features: ["Rotateable COB head", "CCT 2700/4000/6500K"],
    applications: ["Shop", "Restaurant", "Hotel", "Museum", "Lobby"],
    electrical: ["PF 0.6", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 25,000 H", "Voltage 85–256V"],
    warranty: "1 year",
  },
  "ol-12-watt-bright-moon-smd-round": {
    series: "Bright Moon SMD Downlights",
    sourcePage: "p.6",
    blurb: "Bright Moon recessed SMD downlights with multiple wattages and cut-out sizes.",
    specs: [
      { watts: "5W", lumens: "350 lm", notes: "Hole Ø75 mm" },
      { watts: "7W", lumens: "500 lm", notes: "Hole Ø75 mm" },
      { watts: "12W", lumens: "840 lm", notes: "Hole Ø90 mm" },
      { watts: "18W", lumens: "1260 lm", notes: "Hole Ø165 mm" },
      { watts: "24W", lumens: "1680 lm", notes: "Hole Ø165 mm" },
    ],
    features: ["SMD / COB", "CCT 2700/4000/6500K", "120° beam"],
    applications: ["Shop", "Restaurant", "Hotel", "Museum", "Lobby"],
    electrical: ["PF 0.6", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 25,000 H", "AC 90–260V"],
    warranty: "1 year",
  },
  "ol-7-watt-bright-moon-cob-round": {
    series: "Bright Moon COB Round",
    sourcePage: "p.6",
    blurb: "Bright Moon COB recessed round downlight for focused, efficient illumination.",
    specs: [
      { watts: "5W", lumens: "350 lm", notes: "Hole Ø75 mm" },
      { watts: "7W", lumens: "500 lm", notes: "Hole Ø75 mm" },
      { watts: "12W", lumens: "840 lm", notes: "Hole Ø90 mm" },
      { watts: "18W", lumens: "1260 lm", notes: "Hole Ø165 mm" },
      { watts: "24W", lumens: "1680 lm", notes: "Hole Ø165 mm" },
    ],
    features: ["COB LED", "CCT 2700/4000/6500K"],
    applications: ["Shop", "Restaurant", "Hotel", "Museum", "Lobby"],
    electrical: ["PF 0.6", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 25,000 H", "AC 90–260V"],
    warranty: "1 year",
  },
  "anti-glare-adjustable-led-spot-light": {
    series: "Anti-Glare Adjustable Spot Light",
    sourcePage: "p.7",
    blurb: "Deep-recessed anti-glare spot with white or bronze reflector for low UGR accent lighting.",
    specs: [
      { model: "OL-SL03DSW/SE", watts: "3W", lumens: "220 lm", notes: "Cut-out 64 mm · White/Bronze" },
      { model: "OL-SL07DSW/SE", watts: "7W", lumens: "560 lm", notes: "Cut-out 80 mm · White/Bronze" },
    ],
    features: ["Anti-glare / UGR <19", "Adjustable aim", "White or bronze reflector", "2-year warranty"],
    applications: ["Shop", "Restaurant", "Hotel", "Museum", "Lobby"],
    electrical: ["PF 0.9", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 30,000 H", "Voltage 85–256V", "Beam 120°"],
    warranty: "2 years",
  },
  "ol-24-watt-alu-surface-panel-light-round": {
    series: "Ignis Series Recessed Panel (Back Lit)",
    sourcePage: "p.8",
    blurb: "Ignis recessed round/square back-lit panels for uniform indoor ceiling light.",
    specs: [
      { model: "OL-RPL07SRD", watts: "7W", lumens: "630 lm", notes: "Round · cut-out ~100 mm" },
      { model: "OL-RPL12SRD/SQ", watts: "12W", lumens: "1200 lm", notes: "Round/Square" },
      { model: "OL-RPL18SRD/SQ", watts: "18W", lumens: "1800 lm", notes: "Round/Square" },
      { model: "OL-RPL24SRD/SQ", watts: "24W", lumens: "2400 lm", notes: "Round/Square" },
    ],
    features: ["Back-lit panel", "Round & square shapes", "CCT 3000/4000/6500K"],
    applications: ["Home", "Shop", "Office", "Restaurant", "Lobby"],
    electrical: ["PF 0.7", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 25,000 H", "Voltage 85–256V", "Beam 120°"],
    warranty: "1 year",
  },
  "ignis-series-led-surface-panel-lights-round-square": {
    series: "Ignis Series Surface Panel",
    sourcePage: "p.9",
    blurb: "Surface-mounted Ignis panels with backlight technology and DOB heatsink housing.",
    specs: [
      { model: "OL-SPL12ISRD/SQ", watts: "12W", lumens: "1200 lm", notes: "Round/Square" },
      { model: "OL-SPL18ISRD/SQ", watts: "18W", lumens: "1800 lm", notes: "Round/Square" },
      { model: "OL-SPL24ISRD/SQ", watts: "24W", lumens: "2400 lm", notes: "Round/Square" },
    ],
    features: ["Backlight technology (uniform, low glare)", "PPT housing with DOB heatsink"],
    applications: ["Shop", "Restaurant", "Hotel", "Museum", "Lobby"],
    electrical: ["PF 0.7", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 25,000 H", "Voltage 85–256V"],
    warranty: "1 year",
  },
  "ol-18-watt-alu-surface-panel-light-round": {
    series: "Ignis Pro Thin Border Surface Panel",
    sourcePage: "p.9",
    blurb: "Ignis Pro rimless surface panels with polycarbonate housing, backlight optics and higher PF.",
    specs: [
      { model: "OL-SPL24IPRD/SQ", watts: "24W", lumens: "2400 lm", notes: "Round/Square · rimless" },
      { model: "OL-SPL36IPRD/SQ", watts: "36W", lumens: "3600 lm", notes: "Round/Square · rimless" },
    ],
    features: ["Rimless design", "Polycarbonate housing & diffuser", "DOB heatsink", "Backlight technology"],
    applications: ["Shop", "Restaurant", "Hotel", "Museum", "Lobby"],
    electrical: ["PF 0.9", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 30,000 H", "Voltage 85–256V"],
    warranty: "2 years",
  },
  "15w-moon-light-led-panel-ol-apl24rd": {
    series: "Moon Light Recessed Panel",
    sourcePage: "p.10",
    blurb: "Slim circular Moon Light recessed panels for modern interiors.",
    specs: [
      { model: "OL-RBL12RD", watts: "12W", lumens: "1080 lm", notes: "Ø90×20 · cut-out 50–70 mm" },
      { model: "OL-RBL18RD", watts: "18W", lumens: "1620 lm", notes: "Ø123×20 · cut-out 50–90 mm" },
      { model: "OL-RBL24RD", watts: "24W", lumens: "2160 lm", notes: "Ø175×20 · cut-out 50–130 mm" },
      { model: "OL-RBL36RD", watts: "36W", lumens: "3240 lm", notes: "Ø225×20 · cut-out 50–190 mm" },
    ],
    features: ["Borderless circular face", "CCT 3000/4000/6500K"],
    applications: ["Shop", "Restaurant", "Hotel", "Museum", "Lobby"],
    electrical: ["PF 0.5", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 25,000 H", "Voltage 85–256V", "Beam 120°"],
    warranty: "1 year",
  },
  "moon-light-series-surface-panel": {
    series: "Moon Light Surface Panel",
    sourcePage: "p.10",
    blurb: "Surface-mounted Moon Light circular panels for ceilings without cut-outs.",
    specs: [
      { model: "OL-SBL18RD", watts: "18W", lumens: "1620 lm", notes: "Ø120×30" },
      { model: "OL-SBL24RD", watts: "24W", lumens: "2160 lm", notes: "Ø170×30" },
      { model: "OL-SBL36RD", watts: "36W", lumens: "3240 lm", notes: "Ø225×33" },
    ],
    features: ["Surface mount", "CCT 3000/4000/6500K"],
    applications: ["Shop", "Restaurant", "Hotel", "Museum", "Lobby"],
    electrical: ["PF 0.5", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 25,000 H", "Voltage 85–256V"],
    warranty: "1 year",
  },
  "ol-48-watt-tile-ceiling-panel-light-square": {
    series: "2×2 Tile Ceiling Panel (Back Lit)",
    sourcePage: "p.11",
    blurb: "Standard 600×600 recessed tile panels with aluminium frame and polycarbonate optic.",
    specs: [
      { model: "OL-PL36SQ", watts: "36W", lumens: "4320 lm", notes: "600×600×25 · 120 lm/W ±10%" },
      { model: "OL-PL48SQ", watts: "48W", lumens: "5760 lm", notes: "600×600×25 · 120 lm/W ±10%" },
    ],
    features: ["Aluminium frame", "PC optical lens", "Recessed tile install", "UGR <19"],
    applications: ["Office", "Lobby"],
    electrical: ["PF 0.9", "IP20", "CRI ≥80", "Surge 4KV", "Life 30,000 H", "Voltage 85–256V"],
    warranty: "1 year",
  },
  "48-watt-tile-panel-ceiling-panel-light-square-side-light-ol-pl48sq-sl": {
    series: "2×2 Tile Ceiling Panel (Side Light)",
    sourcePage: "p.11",
    blurb: "600×600 side-lit tile panel for even office and commercial ceiling grids.",
    specs: [
      { model: "OL-PL48SQ", watts: "48W", lumens: "5760 lm", notes: "600×600×25 · 120 lm/W" },
      { model: "OL-PL36SQ", watts: "36W", lumens: "4320 lm", notes: "600×600×25 · 120 lm/W" },
    ],
    features: ["Side-light optic", "Aluminium frame", "UGR <19"],
    applications: ["Office", "Lobby"],
    electrical: ["PF 0.9", "IP20", "CRI ≥80", "Surge 4KV", "Life 30,000 H", "Voltage 85–256V"],
    warranty: "1 year",
  },
  "ol-48-watt-tile-ceiling-panel-light-rectangle": {
    series: "1×4 Tile Ceiling Panel",
    sourcePage: "p.11",
    blurb: "300×1200 recessed rectangular tile panel for corridors and open offices.",
    specs: [
      { model: "OL-PL48RT", watts: "48W", lumens: "5760 lm", notes: "300×1200×25 · 120 lm/W ±10%" },
    ],
    features: ["Aluminium frame", "PC optical lens", "Recessed install", "UGR <19"],
    applications: ["Hotel", "Office"],
    electrical: ["PF 0.9", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 25,000 H", "Voltage 85–256V"],
    warranty: "1 year",
  },
  "ol-6-watt-t5-single-batten-round": {
    series: "T5 LED Batten SQ/RD",
    sourcePage: "p.12",
    blurb: "Linkable T5 battens with square/round profiles and centre or side connection.",
    specs: [
      { model: "OL-T506", watts: "6W", lumens: "600 lm", notes: "300×68 · 100 lm/W" },
      { model: "OL-T510", watts: "10W", lumens: "1000 lm", notes: "600×68 · 100 lm/W" },
      { model: "OL-T518", watts: "18W", lumens: "1800 lm", notes: "1200×68 · 100 lm/W" },
    ],
    features: ["Polycarbonate housing", "Centre/side connection", "Square & round options"],
    applications: ["Shop", "Restaurant", "Hotel", "Museum", "Lobby"],
    electrical: ["PF 0.5", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 25,000 H", "Voltage 85–256V"],
    warranty: "1 year",
  },
  "ol-40-watt-office-double-batten": {
    series: "Astro Series Double Batten",
    sourcePage: "p.13",
    blurb: "Surface-mounted Astro double battens with PC body and aluminium inner shell.",
    specs: [
      { model: "OL-DB20U", watts: "20W", lumens: "2000 lm", notes: "28×55×600 · 100 lm/W" },
      { model: "OL-DB40U", watts: "40W", lumens: "4000 lm", notes: "28×55×1200 · 100 lm/W" },
      { model: "OL-DB60U", watts: "60W", lumens: "6000 lm", notes: "28×66×1200 · 100 lm/W" },
    ],
    features: ["High-strength PC + aluminium shell", "Surface-mounted", "CCT 3000/4000/6500K"],
    applications: ["Shop", "Restaurant", "Hotel", "Museum", "Lobby"],
    electrical: ["PF 0.6", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 25,000 H", "Voltage 85–256V", "Beam 120°"],
    warranty: "1 year",
  },
  "ufo-high-bay-light": {
    series: "LED High Bay Light (UFO)",
    sourcePage: "p.18",
    blurb: "Industrial UFO high bays with 140 lm/W efficacy for factories and warehouses.",
    specs: [
      { model: "OL-HB100R", watts: "100W", lumens: "14,000 lm", notes: "292×168 · 140 lm/W · CCT 3000/4000/6500K" },
      { model: "OL-HB150R", watts: "150W", lumens: "21,000 lm", notes: "342×172 · 140 lm/W · CCT 3000/4000/6500K" },
      { model: "OL-HB200R", watts: "200W", lumens: "28,000 lm", notes: "382×175 · 140 lm/W · CCT 3000/4000/6500K" },
    ],
    features: [
      "Die-cast aluminium housing",
      "Polycarbonate optic lens",
      "Powder-coated finish",
      "IP66 waterproof/dustproof",
      "IK08 impact resistance",
      "CCT 3000/4000/6500K",
    ],
    applications: ["Factories", "Warehouses", "Terminals", "Halls"],
    electrical: ["PF 0.9", "IP66", "CRI ≥80", "Surge 6KV", "Life 50,000 H", "Voltage 85–256V", "Beam 120°"],
    warranty: "2 years",
  },
  "50-watt-led-floodlight-ol-fl50es": {
    series: "Evo Lux Series Flood Light",
    sourcePage: "p.19",
    blurb: "Evo Lux floodlights with die-cast body and polycarbonate lens for outdoor areas.",
    specs: [
      { model: "OL-FL30EL", watts: "30W", lumens: "3,600 lm", notes: "130×36×150 · 120 lm/W" },
      { model: "OL-FL50EL", watts: "50W", lumens: "6,000 lm", notes: "165×36×203 · 120 lm/W" },
      { model: "OL-FL100EL", watts: "100W", lumens: "12,000 lm", notes: "215×36×275 · 120 lm/W" },
      { model: "OL-FL150EL", watts: "150W", lumens: "18,000 lm", notes: "255×40×335 · 120 lm/W" },
    ],
    features: ["Die-cast aluminium body", "PC optical lens", "Powder-coated finish", "IP66"],
    applications: ["Factories", "Warehouses", "Grounds", "Halls"],
    electrical: ["PF 0.7", "IP66", "CRI ≥80", "Surge 2.5KV", "Life 25,000 H", "Voltage 85–256V", "Beam 120°"],
    warranty: "1 year",
  },
  "ol-100-watt-econo-smd": {
    series: "Pro Lux Series Flood Light",
    sourcePage: "p.20",
    blurb: "Pro Lux high-efficacy floodlights with frosted glass lens and heavy-duty housing.",
    specs: [
      { model: "OL-FL50PL", watts: "50W", lumens: "7,000 lm", notes: "229×188×40 · 140 lm/W" },
      { model: "OL-FL100PL", watts: "100W", lumens: "14,000 lm", notes: "285×245×45 · 140 lm/W" },
      { model: "OL-FL150PL", watts: "150W", lumens: "21,000 lm", notes: "340×277×55 · 140 lm/W" },
    ],
    features: [
      "High lumen / wide coverage",
      "Die-cast aluminium body",
      "Frosted glass lens",
      "Black powder coat",
      "IP66 weatherproof",
    ],
    applications: ["Factories", "Warehouses", "Grounds", "Halls"],
    electrical: ["PF 0.9", "IP66", "CRI ≥80", "Surge 6KV", "Life 50,000 H", "Voltage 85–256V"],
    warranty: "1 year",
  },
  "80-watt-street-light-smd": {
    series: "Eco / Evo Lux Street Light",
    sourcePage: "p.21",
    blurb: "Roadway street lights with die-cast aluminium body and IP66 sealing for streets and societies.",
    specs: [
      { model: "OL-STL50EC", watts: "50W", lumens: "6,000 lm", notes: "460×131×73 · 120 lm/W" },
      { model: "OL-STL100EC", watts: "100W", lumens: "12,000 lm", notes: "~520×146×75 · 120 lm/W" },
      { model: "OL-STL150EC", watts: "150W", lumens: "18,000 lm", notes: "580×156×75 · 120 lm/W" },
    ],
    features: ["Die-cast aluminium + powder coat", "Silicone gasket IP66", "PC optic lens", "Optional SPD"],
    applications: ["Streets", "Highways", "Societies", "Parks"],
    electrical: ["PF 0.7", "IP66", "CRI ≥80", "Surge 4KV", "Life 30,000 H", "Voltage 85–256V"],
    warranty: "1 year",
  },
  "60-watt-street-light-smd": {
    series: "AdvanLux LED Street Light",
    sourcePage: "p.23",
    blurb:
      "Premium AdvanLux roadway luminaires with Lumileds LEDs, Inventronics/Meanwell drivers and Type II–IV optics.",
    specs: [
      { watts: "30W", lumens: "4,200 lm", notes: "471×196×86 · ~140 lm/W" },
      { watts: "50–60W", lumens: "7,000 lm", notes: "471×196×86" },
      { watts: "80W", lumens: "11,200 lm", notes: "527×196×87" },
      { watts: "100W", lumens: "14,000 lm", notes: "527×196×87" },
      { watts: "120W", lumens: "16,800 lm", notes: "537×244×87" },
      { watts: "150W", lumens: "21,000 lm", notes: "537×244×87" },
      { watts: "180W", lumens: "25,200 lm", notes: "590×244×87" },
      { watts: "200W", lumens: "28,000 lm", notes: "590×244×87" },
      { watts: "240W", lumens: "33,600 lm", notes: "590×244×87" },
    ],
    features: [
      "ADC12 die-cast aluminium + powder coat",
      "Tempered glass + PC optics (Types II–IV)",
      "Inventronics / Meanwell / Philips drivers",
      "Philips Lumileds chips",
      "Spigot mount; optional photocell / Zhaga / NEMA",
      "0–10V dimmable or non-dimmable",
      "IK08 · Class I/II optional",
    ],
    applications: ["Street lighting", "Highways", "Municipal roads"],
    electrical: [
      "PF >0.90",
      "IP66",
      "Ra70 (Ra80 optional)",
      "85–305Vac 50/60Hz",
      "Surge 6kV L-L / 10kV L-E",
      "Life >50,000 H (Ta=30°C @ L70)",
      "THD <10%",
    ],
    warranty: "Up to 5 years (driver selection)",
  },
  "ol-12-watt-alu-recessed-panel-light-square": {
    series: "Alu Recessed Panel Light Round/Square",
    sourcePage: "p.8",
    blurb: "Aluminium recessed panels aligned with Ignis recessed catalogue specs for round and square cut-outs.",
    specs: [
      { model: "OL-RPL12SRD/SQ", watts: "12W", lumens: "1200 lm", notes: "Round/Square" },
      { model: "OL-RPL18SRD/SQ", watts: "18W", lumens: "1800 lm", notes: "Round/Square" },
      { model: "OL-RPL24SRD/SQ", watts: "24W", lumens: "2400 lm", notes: "Round/Square" },
    ],
    features: ["Back-lit recessed panel", "Round & square", "CCT 3000/4000/6500K"],
    applications: ["Home", "Shop", "Office", "Restaurant", "Lobby"],
    electrical: ["PF 0.7", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 25,000 H", "Voltage 85–256V"],
    warranty: "1 year",
  },
  "ol-24-watt-alu-surface-panel-light-square": {
    series: "Alu Surface Panel Light Round/Square",
    sourcePage: "p.9",
    blurb: "Aluminium surface panels matching Ignis surface catalogue range.",
    specs: [
      { model: "OL-SPL12ISRD/SQ", watts: "12W", lumens: "1200 lm", notes: "Round/Square" },
      { model: "OL-SPL18ISRD/SQ", watts: "18W", lumens: "1800 lm", notes: "Round/Square" },
      { model: "OL-SPL24ISRD/SQ", watts: "24W", lumens: "2400 lm", notes: "Round/Square" },
    ],
    features: ["Surface mount", "Backlight technology", "DOB heatsink housing"],
    applications: ["Shop", "Restaurant", "Hotel", "Museum", "Lobby"],
    electrical: ["PF 0.7", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 25,000 H", "Voltage 85–256V"],
    warranty: "1 year",
  },
  "ol-35-watt-rocket-high-power-bulb": {
    series: "Rocket High Power Bulbs (T-Series family)",
    sourcePage: "p.5",
    blurb: "High-power rocket/T-style LED bulbs for bright area lighting — catalogue T-series luminous flux reference.",
    specs: [
      { model: "OL-HP25T", watts: "25W", lumens: "2375 lm", notes: "E27/B22" },
      { model: "OL-HP35T", watts: "35W", lumens: "3325 lm", notes: "E27/B22" },
      { model: "OL-HP45T", watts: "45W", lumens: "4275 lm", notes: "E27/B22" },
      { model: "OL-HP55T", watts: "55W", lumens: "5225 lm", notes: "E27/B22" },
    ],
    features: ["High lumen output", "CCT 3000/4000/6500K", "220° beam"],
    applications: ["Home", "Shop", "Office", "Restaurant"],
    electrical: ["PF 0.5", "IP20", "CRI ≥80", "Surge 2.5KV", "Life 25,000 H", "Voltage 85–256V"],
    warranty: "1 year",
  },
  "ol-85-watt-high-bay-high-power-bulb": {
    series: "High Bay High Power Bulb",
    sourcePage: "p.18",
    blurb:
      "High-power industrial bulb format referenced against Orient high-bay luminous efficacy (~140 lm/W class) for large spaces.",
    specs: [
      { watts: "85W", lumens: "~11,900 lm (est. @140 lm/W)", notes: "Use site photometry for exact layout" },
      { model: "OL-HB100R", watts: "100W", lumens: "14,000 lm", notes: "UFO high bay reference" },
      { model: "OL-HB150R", watts: "150W", lumens: "21,000 lm", notes: "UFO high bay reference" },
    ],
    features: ["High lumen industrial lighting", "Suitable for high ceilings"],
    applications: ["Factories", "Warehouses", "Halls"],
    electrical: ["CRI ≥80 typical", "Wide voltage AC input", "Long service life"],
    warranty: "As per product label",
  },
  "ol-10-watt-hotel-cob-round": {
    series: "Hotel COB Downlight",
    sourcePage: "p.7",
    blurb: "Hotel COB recessed spots related to Orient anti-glare / hospitality downlight catalogue range.",
    specs: [
      { model: "OL-SL07DSW/SE", watts: "7W", lumens: "560 lm", notes: "Anti-glare spot reference" },
      { watts: "10W", lumens: "~700–1000 lm class", notes: "Hospitality COB · confirm SKU sheet" },
    ],
    features: ["COB light source", "Hospitality-focused optics"],
    applications: ["Hotel", "Restaurant", "Lobby", "Shop"],
    electrical: ["IP20 indoor", "CRI ≥80", "Surge protected drivers"],
    warranty: "1–2 years (model dependent)",
  },
  "gv-7-watt-econo-smd-round": {
    series: "Econo SMD Light",
    sourcePage: "p.6",
    blurb: "Value Econo SMD recessed lights in the same lumen class as Orient Bright Moon / Blue Moon downlights.",
    specs: [
      { watts: "5W", lumens: "350 lm", notes: "Bright Moon class" },
      { watts: "7W", lumens: "500–560 lm", notes: "Bright Moon / Blue Moon class" },
      { watts: "12W", lumens: "840–960 lm", notes: "Bright Moon / Blue Moon class" },
    ],
    features: ["SMD LED", "Recessed round", "CCT options"],
    applications: ["Shop", "Home", "Hotel", "Lobby"],
    electrical: ["IP20", "CRI ≥80", "Life ~25,000 H", "Wide AC input"],
    warranty: "1 year",
  },
  "ol-7-watt-idp-smd-round": {
    series: "IDP Series SMD Round",
    sourcePage: "p.6",
    blurb: "IDP series SMD round recessed lights — lumen guidance aligned with Orient downlight catalogue pages.",
    specs: [
      { watts: "7W", lumens: "500–560 lm", notes: "Downlight class" },
      { watts: "12W", lumens: "840–960 lm", notes: "Downlight class" },
      { watts: "18W", lumens: "1260–1440 lm", notes: "Downlight class" },
    ],
    features: ["SMD round recessed", "Multiple cut-out sizes"],
    applications: ["Shop", "Restaurant", "Hotel", "Lobby"],
    electrical: ["IP20", "CRI ≥80", "Life ~25,000 H"],
    warranty: "1 year",
  },
  "12-watt-wi-fi-smart-bulb": {
    series: "Wi-Fi Smart Bulb (12W)",
    sourcePage: "catalogue companion / smart range",
    blurb:
      "Orient Wi-Fi smart bulb with RGB + tunable white. Catalogue-era smart listing: ~950 lumens, E27, app/voice control.",
    specs: [
      { watts: "12W", lumens: "950 lm", notes: "RGB + WW + CW · E27 · Wi-Fi" },
    ],
    features: ["16 million colours", "Warm + cool white", "Wi-Fi enabled", "App control"],
    applications: ["Home", "Smart interiors"],
    electrical: ["AC 90–260V", "1-year warranty typical"],
    warranty: "1 year",
  },
  "12-watt-wi-fi-smart-blue-moon": {
    series: "Wi-Fi Smart Blue Moon (10W)",
    sourcePage: "catalogue companion / smart range",
    blurb:
      "Orient Wi-Fi Smart Blue Moon recessed-style smart light with RGB + white scenes (~950 lumens class).",
    specs: [
      { watts: "10W", lumens: "950 lm", notes: "RGB + WW + CW · Wi-Fi · ~3 inch" },
    ],
    features: ["16 million colours", "Wi-Fi enabled", "Beam ~180°", "App scenes"],
    applications: ["Home", "Smart interiors", "Feature ceilings"],
    electrical: ["AC 90–260V", "1-year warranty typical"],
    warranty: "1 year",
  },
};

function main() {
  const file = path.join(root, "data", "seeded.json");
  const catalog = JSON.parse(readFileSync(file, "utf8")) as {
    products: { handle: string; title: string; description: string; [k: string]: unknown }[];
    [k: string]: unknown;
  };

  let updated = 0;
  const missing: string[] = [];

  for (const p of catalog.products) {
    const entry = CATALOGUE[p.handle];
    if (!entry) {
      missing.push(`${p.handle} (${p.title})`);
      continue;
    }
    p.description = toHtml(entry);
    updated++;
  }

  writeFileSync(file, JSON.stringify(catalog, null, 2) + "\n");
  writeFileSync(
    path.join(root, "data", "catalogue-descriptions.json"),
    JSON.stringify(CATALOGUE, null, 2) + "\n",
  );

  console.log(`Updated ${updated} / ${catalog.products.length} product descriptions from catalogue.`);
  if (missing.length) {
    console.log("No catalogue mapping for:");
    for (const m of missing) console.log(" -", m);
  }
}

main();
