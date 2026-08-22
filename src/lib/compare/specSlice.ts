import {
  resolveCatalogueSpecs,
  type CatalogueEntry,
  type CatalogueSpecRow,
} from "../catalogueSpecs";
import { formatPrice } from "../format";

/** Minimal product shape for comparison prompts (no DB writes). */
export type CompareProductLike = {
  title: string;
  handle: string;
  price?: number | null;
  productType?: string | null;
  sku?: string | null;
  vendor?: string | null;
  description?: string | null;
  facets?: { wattage?: string[]; colorTemp?: string[] } | null;
  options?: { name: string; values: string[] }[] | null;
};

export type CompareSpecSlice = {
  title: string;
  handle: string;
  url: string;
  price: string;
  type: string;
  sku: string;
  series: string | null;
  blurb: string | null;
  wattage: string | null;
  colorTemp: string | null;
  luminousOutput: string | null;
  housing: string | null;
  powerFactor: string | null;
  applications: string | null;
  ipRating: string | null;
  cri: string | null;
  beam: string | null;
  voltage: string | null;
  lifetime: string | null;
  ikRating: string | null;
  mounting: string | null;
  driver: string | null;
  warranty: string | null;
  models: string | null;
  remainingFeatures: string[];
  remainingElectrical: string[];
};

const MISSING = "not listed";

function joinUnique(values: Array<string | null | undefined>): string | null {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const v = raw?.replace(/\s+/g, " ").trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out.length ? out.join("; ") : null;
}

function pickMatching(items: string[], pattern: RegExp): string | null {
  return joinUnique(items.filter((item) => pattern.test(item)));
}

function leftover(items: string[], used: Array<string | null>): string[] {
  const usedLower = new Set(
    used
      .flatMap((u) => (u ? u.split("; ") : []))
      .map((s) => s.toLowerCase()),
  );
  return items.filter((item) => !usedLower.has(item.toLowerCase()));
}

function efficacyFromNotes(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const m = notes.match(/(\d+(?:\.\d+)?)\s*lm\s*\/\s*w/i);
  return m ? `${m[1]} lm/W` : null;
}

function formatLuminous(rows: CatalogueSpecRow[]): string | null {
  if (!rows.length) return null;
  const parts = rows.map((row) => {
    const bits = [row.wattsLabel];
    if (row.lumensLabel) bits.push(row.lumensLabel);
    else if (row.lumens != null) bits.push(`${row.lumens.toLocaleString()} lm`);
    const eff = efficacyFromNotes(row.notes);
    if (eff) bits.push(eff);
    return bits.join(" · ");
  });
  return parts.join("; ");
}

function formatModels(rows: CatalogueSpecRow[]): string | null {
  const models = rows.map((r) => r.model).filter((m): m is string => Boolean(m));
  return models.length ? models.join(", ") : null;
}

function wattageFromProduct(
  product: CompareProductLike,
  entry: CatalogueEntry | null,
): string | null {
  if (entry?.rows.length) {
    return joinUnique(entry.rows.map((r) => r.wattsLabel));
  }
  if (product.facets?.wattage?.length) {
    return product.facets.wattage.join(", ");
  }
  return null;
}

function colorTempFromProduct(
  product: CompareProductLike,
  entry: CatalogueEntry | null,
): string | null {
  if (entry?.colorTemps.length) {
    return entry.colorTemps.map((k) => `${k}K`).join(", ");
  }
  if (product.facets?.colorTemp?.length) {
    return product.facets.colorTemp.join(", ");
  }
  return null;
}

/**
 * Map live product/description specs onto named fields.
 * JSON fills only gaps. Never computes lumens from watts — only listed values.
 */
export function buildCompareSpecSlice(
  product: CompareProductLike,
  catalogue?: CatalogueEntry | null,
): CompareSpecSlice {
  const entry =
    catalogue === undefined
      ? resolveCatalogueSpecs(product.handle, product.description)
      : catalogue;

  const features = entry?.features ?? [];
  const electrical = entry?.electrical ?? [];
  const pool = [...features, ...electrical];

  const housing = pickMatching(
    features,
    /housing|\bbody\b|\bshell\b|frame|die-?cast|ppt housing/i,
  );
  const powerFactor = pickMatching(pool, /\bPF\b|power\s*factor/i);
  const ipRating = pickMatching(pool, /\bIP\s*\d{2}\b/i);
  const cri = pickMatching(pool, /\bCRI\b|\bRa\s*\d+/i);
  const beam = pickMatching(pool, /\bbeam\b|^\d{2,3}\s*°/i);
  const voltage = pickMatching(pool, /voltage|\bVac\b|\bAC\s*\d/i);
  const lifetime = pickMatching(pool, /\blife\b|\bL70\b|\d[\d,]*\s*H\b/i);
  const ikRating = pickMatching(pool, /\bIK\s*\d{2}\b/i);
  const mounting = pickMatching(
    features,
    /mount|recessed|surface|spigot|cut-?out|tile install/i,
  );
  const driver = pickMatching(
    pool,
    /driver|meanwell|inventronics|dob heatsink/i,
  );
  const applications = entry?.applications.length
    ? entry.applications.join(", ")
    : null;

  const used = [
    housing,
    powerFactor,
    ipRating,
    cri,
    beam,
    voltage,
    lifetime,
    ikRating,
    mounting,
    driver,
  ];

  return {
    title: product.title,
    handle: product.handle,
    url: `/products/${product.handle}`,
    price:
      product.price != null && Number.isFinite(product.price)
        ? formatPrice(product.price)
        : "n/a",
    type: product.productType?.trim() || "n/a",
    sku: product.sku?.trim() || "n/a",
    series: entry?.series || null,
    blurb: entry?.blurb || null,
    wattage: wattageFromProduct(product, entry),
    colorTemp: colorTempFromProduct(product, entry),
    luminousOutput: formatLuminous(entry?.rows ?? []),
    housing,
    powerFactor,
    applications,
    ipRating,
    cri,
    beam,
    voltage,
    lifetime,
    ikRating,
    mounting,
    driver,
    warranty: entry?.warranty || null,
    models: formatModels(entry?.rows ?? []),
    remainingFeatures: leftover(features, used),
    remainingElectrical: leftover(electrical, used),
  };
}

function line(label: string, value: string | null, required = false): string | null {
  if (value?.trim()) return `${label}: ${value.trim()}`;
  if (required) return `${label}: ${MISSING}`;
  return null;
}

/** Full spec block sent to the model for one selected product. */
export function formatCompareSpecBlock(slice: CompareSpecSlice): string {
  const lines = [
    `Title: ${slice.title}`,
    `Handle: ${slice.handle}`,
    `URL: ${slice.url}`,
    `Price: ${slice.price}`,
    `Type: ${slice.type}`,
    slice.series ? `Series: ${slice.series}` : null,
    slice.sku !== "n/a" ? `SKU: ${slice.sku}` : null,
    slice.models ? `Models: ${slice.models}` : null,
    line("Wattage", slice.wattage),
    line("Color temp", slice.colorTemp),
    line("Housing material", slice.housing, true),
    line("Luminous output", slice.luminousOutput, true),
    line("Power factor", slice.powerFactor, true),
    line("Application", slice.applications, true),
    line("IP rating", slice.ipRating),
    line("CRI", slice.cri),
    line("Beam", slice.beam),
    line("Voltage", slice.voltage),
    line("Lifetime", slice.lifetime),
    line("IK rating", slice.ikRating),
    line("Mounting", slice.mounting),
    line("Driver", slice.driver),
    line("Warranty", slice.warranty),
    slice.remainingFeatures.length
      ? `Other features: ${slice.remainingFeatures.join("; ")}`
      : null,
    slice.remainingElectrical.length
      ? `Other electrical: ${slice.remainingElectrical.join("; ")}`
      : null,
  ].filter((item): item is string => Boolean(item));

  return lines.join("\n");
}

/** One-line digest for chat catalogue context. Omits missing fields (no invention). */
export function formatCompareDigestLine(slice: CompareSpecSlice): string {
  const parts = [
    `- ${slice.title}`,
    `handle:${slice.handle}`,
    `price:${slice.price}`,
    slice.type !== "n/a" ? `type:${slice.type}` : "",
    slice.wattage ? `wattage:${slice.wattage}` : "",
    slice.colorTemp ? `cct:${slice.colorTemp}` : "",
    slice.housing ? `housing:${slice.housing}` : "",
    slice.luminousOutput ? `lumens:${slice.luminousOutput}` : "",
    slice.powerFactor ? `pf:${slice.powerFactor}` : "",
    slice.applications ? `app:${slice.applications}` : "",
    slice.ipRating ? `ip:${slice.ipRating}` : "",
    slice.cri ? `cri:${slice.cri}` : "",
    `url:${slice.url}`,
  ].filter(Boolean);
  return parts.join(" | ");
}

export type CompareTableRow = {
  key: string;
  label: string;
  values: string[];
};

function cell(value: string | null | undefined): string {
  return value?.trim() || "—";
}

/** Extra spec rows for the side-by-side table. Hide a row when every product is empty. */
export function extraCompareTableRows(slices: CompareSpecSlice[]): CompareTableRow[] {
  const defs: Array<{ key: keyof CompareSpecSlice; label: string }> = [
    { key: "series", label: "Series" },
    { key: "housing", label: "Housing" },
    { key: "luminousOutput", label: "Luminous output" },
    { key: "powerFactor", label: "Power factor" },
    { key: "applications", label: "Application" },
    { key: "ipRating", label: "IP rating" },
    { key: "cri", label: "CRI" },
    { key: "beam", label: "Beam" },
    { key: "voltage", label: "Voltage" },
    { key: "lifetime", label: "Lifetime" },
    { key: "ikRating", label: "IK rating" },
    { key: "mounting", label: "Mounting" },
    { key: "driver", label: "Driver" },
    { key: "warranty", label: "Warranty" },
  ];

  return defs
    .map((def) => {
      const values = slices.map((s) => cell(s[def.key] as string | null));
      return { key: def.key, label: def.label, values };
    })
    .filter((row) => row.values.some((v) => v !== "—"));
}
