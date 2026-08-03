import type { ProductVariant } from "@/lib/types";

/** Normalize wattage tokens to "100 Watt" style for storefront parsers. */
export function normalizeWattageValues(raw: string[]): string[] {
  return raw
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const n = s.match(/(\d+(?:\.\d+)?)/)?.[1];
      if (!n) return s;
      return `${Number(n)} Watt`;
    });
}

/** Normalize CCT tokens to "3000k" style. */
export function normalizeColorTempValues(raw: string[]): string[] {
  return raw
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const n = s.match(/(\d{4})/)?.[1];
      return n ? `${n}k` : s;
    });
}

export function normalizeStyleValues(raw: string[]): string[] {
  return raw.map((s) => s.trim()).filter(Boolean);
}

function cartesian(lists: string[][]): string[][] {
  if (!lists.length) return [[]];
  return lists.reduce<string[][]>(
    (acc, list) => acc.flatMap((prefix) => list.map((v) => [...prefix, v])),
    [[]],
  );
}

export type BuiltCatalogOptions = {
  options: { name: string; values: string[]; position: number }[];
  variants: ProductVariant[];
};

/** Map keyed by watt number string, e.g. "100" → prices for that wattage. */
export type WattagePriceMap = Record<
  string,
  { price: number; compareAtPrice: number | null }
>;

/** Map keyed by watt number string → optional size/length label. */
export type WattageSizeMap = Record<string, string>;

function wattKeyFromValue(value: string): string | null {
  const n = value.match(/(\d+(?:\.\d+)?)/)?.[1];
  return n ? String(Number(n)) : null;
}

/**
 * Build Shopify-style options + variants so ProductOptions can show
 * Wattage / Color temperature (Warm light/3000K) chips on the storefront.
 */
export function buildVariantsFromAdminFields(input: {
  productId: string;
  price: number;
  compareAtPrice: number | null;
  wattages: string[];
  colorTemps: string[];
  styles: string[];
  wattagePrices?: WattagePriceMap;
  wattageSizes?: WattageSizeMap;
  existingVariants?: ProductVariant[];
}): BuiltCatalogOptions {
  const watts = normalizeWattageValues(input.wattages);
  const temps = normalizeColorTempValues(input.colorTemps);
  const styles = normalizeStyleValues(input.styles);
  const wattPrices = input.wattagePrices || {};
  const wattSizes = input.wattageSizes || {};

  const dims: { name: string; values: string[] }[] = [];
  if (styles.length) dims.push({ name: "Style", values: styles });
  if (watts.length) dims.push({ name: "Wattage", values: watts });
  if (temps.length) dims.push({ name: "Color temperature", values: temps });

  const options = dims.map((d, i) => ({
    name: d.name,
    values: d.values,
    position: i + 1,
  }));

  const wattDimIndex = dims.findIndex((d) => d.name === "Wattage");
  const combos = dims.length ? cartesian(dims.map((d) => d.values)) : [[]];

  const byTitle = new Map(
    (input.existingVariants || []).map((v) => [v.title.toLowerCase(), v]),
  );

  const variants: ProductVariant[] = combos.map((parts, i) => {
    const title = parts.length ? parts.join(" / ") : "Default";
    const prev = byTitle.get(title.toLowerCase());

    let price = input.price;
    let compareAtPrice = input.compareAtPrice;
    let size: string | null = null;
    if (wattDimIndex >= 0) {
      const key = wattKeyFromValue(parts[wattDimIndex] || "");
      if (key && wattPrices[key]) {
        price = wattPrices[key].price;
        compareAtPrice = wattPrices[key].compareAtPrice;
      }
      if (key && wattSizes[key]) {
        size = wattSizes[key];
      }
    }

    return {
      id: prev?.id || `${input.productId}_v${i}`,
      title,
      price,
      compareAtPrice,
      sku: prev?.sku || "",
      available: prev?.available ?? true,
      option1: parts[0] ?? null,
      option2: parts[1] ?? null,
      option3: parts[2] ?? null,
      size,
    };
  });

  return { options, variants };
}

/** Lowest price across wattage map, or fallback. */
export function resolveListPrice(
  basePrice: number,
  wattagePrices: WattagePriceMap,
): number {
  const prices = Object.values(wattagePrices)
    .map((p) => p.price)
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!prices.length) return basePrice;
  return Math.min(...prices);
}

function variantsForWattage(
  variants: ProductVariant[],
  token: string,
): ProductVariant[] {
  const key = wattKeyFromValue(token);
  if (!key) return [];
  const normalized = normalizeWattageValues([token])[0];
  return variants.filter((v) => {
    const opts = [v.option1, v.option2, v.option3, v.title].filter(Boolean) as string[];
    return opts.some(
      (o) =>
        o === normalized ||
        wattKeyFromValue(o) === key ||
        new RegExp(`\\b${key}\\b`).test(o),
    );
  });
}

/** Build wattage → price map from existing variants (for admin edit hydrate). */
export function wattagePricesFromVariants(
  variants: ProductVariant[] | undefined,
  wattageTokens: string[],
): WattagePriceMap {
  const map: WattagePriceMap = {};
  if (!variants?.length || !wattageTokens.length) return map;

  for (const token of wattageTokens) {
    const key = wattKeyFromValue(token);
    if (!key) continue;
    const matching = variantsForWattage(variants, token);
    if (!matching.length) continue;
    const cheapest = matching.reduce((a, b) => (a.price <= b.price ? a : b));
    map[key] = {
      price: cheapest.price,
      compareAtPrice: cheapest.compareAtPrice ?? null,
    };
  }
  return map;
}

/** Build wattage → size/length map from existing variants (for admin edit hydrate). */
export function wattageSizesFromVariants(
  variants: ProductVariant[] | undefined,
  wattageTokens: string[],
): WattageSizeMap {
  const map: WattageSizeMap = {};
  if (!variants?.length || !wattageTokens.length) return map;

  for (const token of wattageTokens) {
    const key = wattKeyFromValue(token);
    if (!key) continue;
    const matching = variantsForWattage(variants, token);
    const sized = matching.find((v) => v.size?.trim());
    if (sized?.size?.trim()) map[key] = sized.size.trim();
  }
  return map;
}

export function looksLikeHtml(value: string) {
  return /<[a-z][\s\S]*>/i.test(value);
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Keep catalogue HTML; wrap plain text as paragraphs for the storefront. */
export function normalizeProductDescription(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (looksLikeHtml(trimmed)) return trimmed;
  return trimmed
    .split(/\n{2,}/)
    .map((block) => {
      const withBreaks = escapeHtml(block).replace(/\n/g, "<br/>");
      return `<p>${withBreaks}</p>`;
    })
    .join("\n");
}

export function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
