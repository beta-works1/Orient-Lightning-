import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { buildDealerSeed } from "./seed-dealers";
import type { Dealer } from "./dealers";

let cache: Dealer[] | null = null;

/**
 * Server-only: load dealers from data/dealers.json, falling back to in-code seed.
 * Includes verified:false placeholders for layout testing — strip before production.
 */
export function getDealers(): Dealer[] {
  if (cache) return cache;
  try {
    const file = path.join(process.cwd(), "data", "dealers.json");
    const raw = JSON.parse(readFileSync(file, "utf8")) as Dealer[];
    if (Array.isArray(raw) && raw.length > 0) {
      cache = raw;
      return cache;
    }
  } catch {
    // fall through
  }
  cache = buildDealerSeed();
  return cache;
}

/** Write seed to data/dealers.json (used by seed script). */
export function writeDealersJson(dealers: Dealer[] = buildDealerSeed()) {
  const file = path.join(process.cwd(), "data", "dealers.json");
  writeFileSync(file, `${JSON.stringify(dealers, null, 2)}\n`, "utf8");
  return file;
}
