import type { Product, ProductVariant } from "@/lib/types";

export type LightTone = "Warm" | "Natural" | "Daylight";

export type ParsedDims = {
  shape: string | null;
  size: string | null;
  wattage: string | null; // numeric string e.g. "100"
  tone: LightTone | null;
  colorTemp: string | null; // e.g. "3000"
  base: string | null; // B22 / E27
};

export type ParsedVariant = ParsedDims & {
  variant: ProductVariant;
};

const TONE_ORDER: LightTone[] = ["Warm", "Natural", "Daylight"];

export function toneFromKelvin(k: number): LightTone {
  if (k < 3500) return "Warm";
  if (k < 5000) return "Natural";
  return "Daylight";
}

export function toneLabel(tone: LightTone): string {
  switch (tone) {
    case "Warm":
      return "Warm light";
    case "Natural":
      return "Natural light";
    case "Daylight":
      return "Daylight";
  }
}

export function toneHint(tone: LightTone): string {
  switch (tone) {
    case "Warm":
      return "Cozy, soft glow";
    case "Natural":
      return "Balanced white";
    case "Daylight":
      return "Bright, crisp white";
  }
}

function detectTone(text: string): LightTone | null {
  const t = text.toLowerCase();
  if (/warm/.test(t)) return "Warm";
  if (/natural/.test(t)) return "Natural";
  if (/day\s*light|daylight|cool\s*white|cool\s*light/.test(t)) return "Daylight";
  return null;
}

/** Catalogue-standard CCT when a tone label has no explicit Kelvin. */
export function kelvinFromTone(tone: LightTone): string {
  switch (tone) {
    case "Warm":
      return "3000";
    case "Natural":
      return "4000";
    case "Daylight":
      return "6500";
  }
}

export function parseVariantTitle(title: string): ParsedDims {
  const raw = title || "";

  const wattMatch =
    raw.match(/(\d+(?:\.\d+)?)\s*(?:w|watt)\b/i) ||
    raw.match(/\b(\d+(?:\.\d+)?)\s*w\b/i);
  const wattage = wattMatch ? String(Number(wattMatch[1])) : null;

  const kelvinMatch = raw.match(/(\d{4})\s*k\b/i);
  let colorTemp = kelvinMatch ? kelvinMatch[1] : null;

  let tone = detectTone(raw);
  if (!tone && colorTemp) tone = toneFromKelvin(Number(colorTemp));
  if (!colorTemp && tone) colorTemp = kelvinFromTone(tone);

  const shapeMatch = raw.match(
    /\b(round|square|white\s*color|bronze\s*color|black|white|bronze)\b/i,
  );
  let shape = shapeMatch ? shapeMatch[1].replace(/\s+/g, " ") : null;
  if (shape) {
    shape = shape
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  const sizeMatch =
    raw.match(/(\d+(?:\.\d+)?)\s*(?:inch|inches|in)\b/i) ||
    raw.match(/(\d+)\s*(?:ft|feet)\b/i) ||
    raw.match(/(\d+)\s*inch/i);
  let size: string | null = null;
  if (sizeMatch) {
    size = /\bft|feet\b/i.test(sizeMatch[0]) ? `${sizeMatch[1]} ft` : `${sizeMatch[1]}"`;
  }

  const baseMatch = raw.match(/\b(B22|E27|E14|GU10)\b/i);
  const base = baseMatch ? baseMatch[1].toUpperCase() : null;

  return { shape, size, wattage, tone, colorTemp, base };
}

export function parseVariants(product: Product): ParsedVariant[] {
  const list = product.variants?.length ? product.variants : [];
  return list.map((variant) => ({
    variant,
    ...parseVariantTitle(variant.title || ""),
  }));
}

export type OptionSelections = {
  shape: string | null;
  size: string | null;
  wattage: string | null;
  tone: LightTone | null;
  colorTemp: string | null;
  base: string | null;
};

function matches(p: ParsedVariant, sel: OptionSelections): boolean {
  if (sel.shape && p.shape !== sel.shape) return false;
  if (sel.size && p.size !== sel.size) return false;
  if (sel.wattage && p.wattage !== sel.wattage) return false;
  if (sel.tone && p.tone !== sel.tone) return false;
  if (sel.colorTemp && p.colorTemp !== sel.colorTemp) return false;
  if (sel.base && p.base !== sel.base) return false;
  return true;
}

export function filterParsed(list: ParsedVariant[], sel: OptionSelections): ParsedVariant[] {
  return list.filter((p) => matches(p, sel));
}

export function uniqueSorted(
  list: ParsedVariant[],
  key: keyof ParsedDims,
  numeric = false,
): string[] {
  const set = new Set<string>();
  for (const p of list) {
    const v = p[key];
    if (v) set.add(v);
  }
  const arr = Array.from(set);
  if (key === "tone") {
    return TONE_ORDER.filter((t) => set.has(t));
  }
  if (numeric) {
    return arr.sort((a, b) => Number(a) - Number(b));
  }
  return arr.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function initialSelections(parsed: ParsedVariant[]): OptionSelections {
  const first = parsed[0];
  return {
    shape: first?.shape ?? null,
    size: first?.size ?? null,
    wattage: first?.wattage ?? null,
    tone: first?.tone ?? null,
    colorTemp: first?.colorTemp ?? null,
    base: first?.base ?? null,
  };
}

/** After changing one dimension, snap other dims to a still-valid combination. */
export function reconcileSelections(
  parsed: ParsedVariant[],
  next: OptionSelections,
): OptionSelections {
  let pool = filterParsed(parsed, next);
  if (pool.length) return { ...next };

  // Drop least-critical constraints until we find a match
  const order: (keyof OptionSelections)[] = [
    "base",
    "size",
    "colorTemp",
    "tone",
    "shape",
    "wattage",
  ];
  const sel = { ...next };
  for (const key of order) {
    sel[key] = null;
    pool = filterParsed(parsed, sel);
    if (pool.length) {
      const pick = pool[0];
      return {
        shape: sel.shape ?? pick.shape,
        size: sel.size ?? pick.size,
        wattage: sel.wattage ?? pick.wattage,
        tone: sel.tone ?? pick.tone,
        colorTemp: sel.colorTemp ?? pick.colorTemp,
        base: sel.base ?? pick.base,
      };
    }
  }
  return initialSelections(parsed);
}

export function findVariantId(parsed: ParsedVariant[], sel: OptionSelections): string | undefined {
  const hit = filterParsed(parsed, sel)[0];
  return hit?.variant.id;
}

export function lightToneFromColorTempValue(value: string): LightTone {
  const n = Number(String(value).replace(/k$/i, ""));
  if (!Number.isFinite(n)) return "Daylight";
  return toneFromKelvin(n);
}
