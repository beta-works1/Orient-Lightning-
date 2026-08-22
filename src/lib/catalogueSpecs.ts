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

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function listAfterHeading(html: string, heading: RegExp): string[] {
  const match = heading.exec(html);
  if (!match) return [];
  const after = html.slice(match.index + match[0].length);
  const ulPos = after.search(/<ul\b/i);
  if (ulPos < 0 || ulPos > 500) return [];
  const ul = after.slice(ulPos).match(/<ul\b[^>]*>([\s\S]*?)<\/ul>/i);
  if (!ul) return [];
  return [...ul[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => stripTags(m[1]))
    .filter(Boolean);
}

function paragraphAfterHeading(html: string, heading: RegExp): string | null {
  const match = heading.exec(html);
  if (!match) return null;
  const after = html.slice(match.index + match[0].length);
  const p = after.match(/^\s*(?:<\/(?:p|h[1-6]|strong|b)>\s*)*<p\b[^>]*>([\s\S]*?)<\/p>/i);
  if (p) {
    const text = stripTags(p[1]);
    return text || null;
  }
  const sameLine = stripTags(match[0])
    .replace(/^(features|electrical(?:\s*&\s*performance)?|applications|warranty)\s*:?\s*/i, "")
    .trim();
  return sameLine.length > 2 ? sameLine : null;
}

function parseApplications(html: string): string[] {
  const raw =
    paragraphAfterHeading(html, /<strong>\s*Applications\s*:?\s*<\/strong>/i) ||
    paragraphAfterHeading(html, /Applications\s*:/i);
  if (!raw) return [];
  return raw
    .split(/[,;•|/]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

function parseWarranty(html: string): string | null {
  const strong = html.match(/<strong>\s*Warranty:?\s*<\/strong>\s*([^<]+)/i);
  if (strong?.[1]?.trim()) return stripTags(strong[1]);
  return paragraphAfterHeading(html, /<strong>\s*Warranty\s*:?\s*<\/strong>/i);
}

export type ParsedCatalogueDescription = {
  rows: CatalogueSpecRow[];
  colorTemps: string[];
  series: string | null;
  blurb: string;
  features: string[];
  electrical: string[];
  applications: string[];
  warranty: string | null;
};

/**
 * Parse product description HTML (or stripped plain text).
 * This is the live DB/spec source; JSON is only a fallback for missing fields.
 */
export function parseCatalogueFromDescription(
  html: string | null | undefined,
): ParsedCatalogueDescription | null {
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

  const features = listAfterHeading(html, /<strong>\s*Features\s*:?\s*<\/strong>/i);
  const electrical = listAfterHeading(
    html,
    /<strong>\s*Electrical(?:\s*(?:&amp;|&)\s*performance)?\s*:?\s*<\/strong>/i,
  );
  const applications = parseApplications(html);
  const warranty = parseWarranty(html);

  if (!rows.length && !features.length && !electrical.length && !applications.length) {
    return null;
  }

  const seriesMatch = html.match(/<strong>([^<]+)<\/strong>\s*—\s*from Orient Lighting Catalogue/i);
  const blurbMatch = html.match(
    /from Orient Lighting Catalogue[^<]*<\/p>\s*<p>([\s\S]*?)<\/p>/i,
  );
  const colorTemps = extractColorTemps(
    html,
    ...rows.map((r) => r.notes || ""),
    ...features,
    ...electrical,
  );

  return {
    rows,
    colorTemps,
    series: seriesMatch?.[1] || null,
    blurb: blurbMatch ? stripTags(blurbMatch[1]) : "",
    features,
    electrical,
    applications,
    warranty,
  };
}

const FEATURE_FIELD_KINDS = [
  /housing|\bbody\b|\bshell\b|frame|die-?cast|ppt housing/i,
  /mount|recessed|surface|spigot|cut-?out|tile install/i,
  /\bIK\s*\d{2}\b/i,
  /\bIP\s*\d{2}\b/i,
  /\bbeam\b/i,
  /driver|meanwell|inventronics|dob heatsink/i,
];

const ELECTRICAL_FIELD_KINDS = [
  /\bPF\b|power\s*factor/i,
  /\bIP\s*\d{2}\b/i,
  /\bCRI\b|\bRa\s*\d+/i,
  /\bbeam\b|^\d{2,3}\s*°/i,
  /voltage|\bVac\b|\bAC\s*\d/i,
  /\blife\b|\bL70\b|\d[\d,]*\s*H\b/i,
  /driver|meanwell|inventronics|dob heatsink/i,
];

function hasKind(items: string[], re: RegExp): boolean {
  return items.some((item) => re.test(item));
}

/** Live list wins; JSON items fill only kinds the live list does not mention. */
function mergeTypedList(live: string[], fallback: string[], kinds: RegExp[]): string[] {
  if (!live.length) return fallback.slice();
  if (!fallback.length) return live.slice();
  const out = live.slice();
  const seen = new Set(out.map((item) => item.toLowerCase()));
  for (const re of kinds) {
    if (hasKind(live, re)) continue;
    for (const item of fallback) {
      if (!re.test(item)) continue;
      const key = item.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

function mergeRows(live: CatalogueSpecRow[], fallback: CatalogueSpecRow[]): CatalogueSpecRow[] {
  if (!live.length) return fallback;
  return live.map((row) => {
    const hasLumens = row.lumens != null || Boolean(row.lumensLabel);
    if (hasLumens) return row;
    const fb = fallback.find((r) => r.watts === row.watts);
    if (!fb) return row;
    return {
      ...row,
      lumens: fb.lumens,
      lumensLabel: fb.lumensLabel,
      notes: row.notes || fb.notes,
    };
  });
}

function pickText(live: string | null | undefined, fallback: string | null | undefined): string {
  const a = live?.trim() || "";
  if (a && a !== "Catalogue specifications") return a;
  return fallback?.trim() || a;
}

function parsedToEntry(
  handle: string,
  parsed: ParsedCatalogueDescription | null,
): CatalogueEntry | null {
  if (!parsed) return null;
  return {
    handle,
    series: parsed.series || "",
    sourcePage: "",
    blurb: parsed.blurb,
    rows: parsed.rows,
    colorTemps: parsed.colorTemps,
    features: parsed.features,
    electrical: parsed.electrical,
    applications: parsed.applications,
    warranty: parsed.warranty,
  };
}

/**
 * Live description / product record wins. JSON fills only fields the live entry omits.
 */
export function mergeCatalogueEntry(
  live: CatalogueEntry | null,
  fallback: CatalogueEntry | null,
): CatalogueEntry | null {
  if (!live) return fallback;
  if (!fallback) return live;
  return {
    handle: live.handle || fallback.handle,
    series: pickText(live.series, fallback.series) || "Catalogue specifications",
    sourcePage: live.sourcePage || fallback.sourcePage,
    blurb: live.blurb || fallback.blurb,
    rows: mergeRows(live.rows, fallback.rows),
    colorTemps: live.colorTemps.length ? live.colorTemps : fallback.colorTemps,
    features: mergeTypedList(live.features, fallback.features, FEATURE_FIELD_KINDS),
    electrical: mergeTypedList(live.electrical, fallback.electrical, ELECTRICAL_FIELD_KINDS),
    applications: live.applications.length ? live.applications : fallback.applications,
    warranty: live.warranty || fallback.warranty,
  };
}

export function resolveCatalogueSpecs(
  handle: string | null | undefined,
  description?: string | null,
): CatalogueEntry | null {
  const live = parsedToEntry(handle || "", parseCatalogueFromDescription(description));
  const fromJson = getCatalogueEntry(handle);
  return mergeCatalogueEntry(live, fromJson);
}
