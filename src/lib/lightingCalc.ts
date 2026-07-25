import type { Product, ProductVariant } from "@/lib/types";
import { findCatalogueRow, resolveCatalogueSpecs } from "@/lib/catalogueSpecs";

/** Typical maintained illuminance targets in foot-candles (lm/ft²). */
export const ROOM_TYPES = [
  { id: "living", label: "Living room", footCandles: 15 },
  { id: "bedroom", label: "Bedroom", footCandles: 12 },
  { id: "kitchen", label: "Kitchen", footCandles: 40 },
  { id: "bathroom", label: "Bathroom", footCandles: 40 },
  { id: "office", label: "Office / study", footCandles: 40 },
  { id: "dining", label: "Dining", footCandles: 20 },
  { id: "hallway", label: "Hallway", footCandles: 8 },
  { id: "garage", label: "Garage / store", footCandles: 30 },
] as const;

export type RoomTypeId = (typeof ROOM_TYPES)[number]["id"];

/** Conservative LED efficacy when product lumen rating is unknown. */
export const DEFAULT_LM_PER_WATT = 95;

export function parseWattage(text: string | null | undefined): number | null {
  if (!text) return null;
  const m = text.match(/(\d+(?:\.\d+)?)\s*(?:w|watt)/i) || text.match(/^(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Match lumen totals — never efficacy like "140 lm/W". */
export function parseLumensFromText(text: string | null | undefined): number | null {
  if (!text) return null;
  const plain = text.replace(/<[^>]+>/g, " ");
  const matches = [
    ...plain.matchAll(/(\d[\d,]*)\s*(?:lumens?|lm)(?!\s*\/\s*w)(?![a-zA-Z])/gi),
  ];
  if (!matches.length) return null;
  // Prefer the largest plausible total (avoids picking efficacy leftovers).
  let best: number | null = null;
  for (const m of matches) {
    const n = Number(m[1].replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) continue;
    if (best == null || n > best) best = n;
  }
  return best;
}

/** Prefer lumen row matching selected wattage from catalogue HTML tables. */
export function parseLumensForWattage(
  text: string | null | undefined,
  watts: number | null,
): number | null {
  if (!text) return null;
  if (watts == null) return parseLumensFromText(text);

  const rowRe =
    /<tr>\s*<td>[^<]*<\/td>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>/gi;
  let match: RegExpExecArray | null;
  while ((match = rowRe.exec(text))) {
    const rowWatts = parseWattage(match[1]);
    if (rowWatts === watts) {
      const lm = parseLumensFromText(match[2]);
      if (lm) return lm;
    }
  }

  // Plain mash: 100W14,000 lm… or 100 W … 14000
  const plain = text.replace(/<[^>]+>/g, " ");
  const near = plain.match(
    new RegExp(
      `${watts}\\s*W[^\\d]{0,24}(\\d[\\d,]*)\\s*(?:lumens?|lm)(?!\\s*/\\s*w)`,
      "i",
    ),
  );
  if (near) {
    const n = Number(near[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }

  return parseLumensFromText(text);
}

export function estimateLumensFromWatts(watts: number): number {
  return Math.round(watts * DEFAULT_LM_PER_WATT);
}

export function getProductWattage(product: Product, variant?: ProductVariant | null): number | null {
  const fromVariant =
    parseWattage(variant?.title) ||
    parseWattage(variant?.option1 || undefined) ||
    parseWattage(variant?.option2 || undefined) ||
    parseWattage(variant?.option3 || undefined);
  if (fromVariant) return fromVariant;

  const fromOptions = product.options
    ?.flatMap((o) => o.values)
    .map(parseWattage)
    .find((w) => w != null);
  if (fromOptions) return fromOptions;

  const fromFacets = product.facets?.wattage
    ?.map((w) => parseWattage(w) ?? Number(w))
    .find((w) => Number.isFinite(w) && w > 0);
  if (fromFacets) return fromFacets;

  const fromTags = product.tags?.map(parseWattage).find((w) => w != null);
  return fromTags ?? null;
}

export function getProductLumens(product: Product, variant?: ProductVariant | null): {
  lumens: number | null;
  source: "listed" | "estimated" | null;
  watts: number | null;
} {
  const watts = getProductWattage(product, variant);
  const catalogue = resolveCatalogueSpecs(product.handle, product.description);
  const fromCatalogue = findCatalogueRow(catalogue, watts)?.lumens;
  if (fromCatalogue) {
    return { lumens: fromCatalogue, source: "listed", watts };
  }

  const listed = parseLumensForWattage(product.description, watts);
  if (listed) {
    return { lumens: listed, source: "listed", watts };
  }
  if (watts) {
    return { lumens: estimateLumensFromWatts(watts), source: "estimated", watts };
  }
  return { lumens: null, source: null, watts: null };
}

export function calcRequiredLumens(areaSqFt: number, footCandles: number): number {
  return Math.round(areaSqFt * footCandles);
}

export function calcBulbsNeeded(requiredLumens: number, lumensPerBulb: number): number {
  if (lumensPerBulb <= 0 || requiredLumens <= 0) return 0;
  return Math.max(1, Math.ceil(requiredLumens / lumensPerBulb));
}
