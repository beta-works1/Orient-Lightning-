import catalogueDescriptions from "../../data/catalogue-descriptions.json";

function parseWattage(text: string | null | undefined): number | null {
  if (!text) return null;
  const m = text.match(/(\d+(?:\.\d+)?)\s*(?:w|watt)/i) || text.match(/^(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export type CatalogueSpecRow = {
  model: string | null;
  watts: number;
  wattsLabel: string;
  lumens: number | null;
  lumensLabel: string | null;
  notes: string | null;
};

export type CatalogueEntry = {
  handle: string;
  series: string;
  sourcePage: string;
  blurb: string;
  rows: CatalogueSpecRow[];
  colorTemps: string[];
  features: string[];
  electrical: string[];
  applications: string[];
  warranty: string | null;
};

type RawSpec = {
  model?: string;
  watts: string;
  lumens: string;
  notes?: string;
};

type RawEntry = {
  series: string;
  sourcePage: string;
  blurb: string;
  specs: RawSpec[];
  features?: string[];
  electrical?: string[];
  applications?: string[];
  warranty?: string;
};

const RAW = catalogueDescriptions as Record<string, RawEntry>;

function parseLumenValue(text: string | null | undefined): number | null {
  if (!text) return null;
  const m = text.match(/(\d[\d,]*)\s*(?:lumens?|lm)\b(?!\s*\/\s*w)/i) || text.match(/(\d[\d,]*)/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractColorTemps(...chunks: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const chunk of chunks) {
    if (!chunk) continue;
    const cctBlock = chunk.match(/CCT\s*([0-9K/\s,]+)/i);
    const hay = cctBlock ? cctBlock[1] : chunk;
    for (const m of hay.matchAll(/\b(2700|3000|3500|4000|5000|5700|6500)\s*k?\b/gi)) {
      set.add(m[1]);
    }
  }
  return Array.from(set).sort((a, b) => Number(a) - Number(b));
}

function normalizeRow(spec: RawSpec): CatalogueSpecRow | null {
  const watts = parseWattage(spec.watts);
  if (!watts) return null;
  const lumens = parseLumenValue(spec.lumens);
  return {
    model: spec.model?.trim() || null,
    watts,
    wattsLabel: `${watts}W`,
    lumens,
    lumensLabel: lumens != null ? `${lumens.toLocaleString()} lm` : spec.lumens || null,
    notes: spec.notes?.trim() || null,
  };
}

function fromRaw(handle: string, raw: RawEntry): CatalogueEntry {
  const rows = raw.specs.map(normalizeRow).filter((r): r is CatalogueSpecRow => r != null);
  const colorTemps = extractColorTemps(
    raw.blurb,
    ...(raw.features || []),
    ...raw.specs.map((s) => s.notes || ""),
  );
  return {
    handle,
    series: raw.series,
    sourcePage: raw.sourcePage,
    blurb: raw.blurb,
    rows,
    colorTemps,
    features: raw.features || [],
    electrical: raw.electrical || [],
    applications: raw.applications || [],
    warranty: raw.warranty || null,
  };
}

/** Official Orient Lighting Catalogue 2026–27 specs keyed by product handle. */
export function getCatalogueEntry(handle: string | null | undefined): CatalogueEntry | null {
  if (!handle) return null;
  const raw = RAW[handle];
  return raw ? fromRaw(handle, raw) : null;
}

export function findCatalogueRow(
  entry: CatalogueEntry | null | undefined,
  watts: number | string | null | undefined,
): CatalogueSpecRow | null {
  if (!entry || watts == null || watts === "") return null;
  const w = typeof watts === "number" ? watts : Number(String(watts).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(w)) return null;
  return entry.rows.find((r) => r.watts === w) ?? null;
}

/**
 * Fallback parser for product description HTML (or stripped plain text).
 * Prefer getCatalogueEntry(handle) when the handle is mapped.
 */
export function parseCatalogueFromDescription(html: string | null | undefined): {
  rows: CatalogueSpecRow[];
  colorTemps: string[];
  series: string | null;
} | null {
  if (!html) return null;
  const rows: CatalogueSpecRow[] = [];

  const rowRe =
    /<tr>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>\s*<\/tr>/gi;
  let match: RegExpExecArray | null;
  while ((match = rowRe.exec(html))) {
    const row = normalizeRow({
      model: match[1] === "—" ? undefined : match[1],
      watts: match[2],
      lumens: match[3],
      notes: match[4] === "—" ? undefined : match[4],
    });
    if (row) rows.push(row);
  }

  // Stripped plain-text mash: OL-HB100R100W14,000 lm292×168 · 140 lm/W
  if (!rows.length) {
    const plain = html.replace(/<[^>]+>/g, " ");
    const mash =
      /([A-Z]{2,}[-A-Z0-9/]*)\s*(\d+)\s*W\s*([\d,]+)\s*lm(?!\s*\/\s*w)([^O]*?)(?=[A-Z]{2,}[-A-Z0-9/]*\s*\d+\s*W|$)/gi;
    let m: RegExpExecArray | null;
    while ((m = mash.exec(plain))) {
      const row = normalizeRow({
        model: m[1],
        watts: `${m[2]}W`,
        lumens: `${m[3]} lm`,
        notes: m[4]?.replace(/\s+/g, " ").trim(),
      });
      if (row) rows.push(row);
    }
  }

  if (!rows.length) return null;

  const seriesMatch = html.match(/<strong>([^<]+)<\/strong>\s*—\s*from Orient Lighting Catalogue/i);
  const colorTemps = extractColorTemps(html, ...rows.map((r) => r.notes || ""));

  return {
    rows,
    colorTemps,
    series: seriesMatch?.[1] || null,
  };
}

export function resolveCatalogueSpecs(
  handle: string | null | undefined,
  description?: string | null,
): CatalogueEntry | null {
  const fromJson = getCatalogueEntry(handle);
  if (fromJson) return fromJson;

  const parsed = parseCatalogueFromDescription(description);
  if (!parsed) return null;

  return {
    handle: handle || "",
    series: parsed.series || "Catalogue specifications",
    sourcePage: "",
    blurb: "",
    rows: parsed.rows,
    colorTemps: parsed.colorTemps,
    features: [],
    electrical: [],
    applications: [],
    warranty: null,
  };
}
