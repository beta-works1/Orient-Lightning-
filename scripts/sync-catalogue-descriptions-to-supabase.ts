/**
 * Push catalogue HTML descriptions (from apply-catalogue-descriptions) to Supabase products.
 * Usage: npx tsx scripts/sync-catalogue-descriptions-to-supabase.ts
 */
import { readFileSync } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !service) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type SpecRow = { model?: string; watts: string; lumens: string; notes?: string };
type Entry = {
  series: string;
  blurb: string;
  specs: SpecRow[];
  features: string[];
  applications: string[];
  electrical: string[];
  warranty?: string;
  sourcePage: string;
};

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

function toHtml(e: Entry) {
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

async function main() {
  const catalogue = JSON.parse(
    readFileSync(path.join(process.cwd(), "data", "catalogue-descriptions.json"), "utf8"),
  ) as Record<string, Entry>;

  let updated = 0;
  let missing = 0;

  for (const [handle, entry] of Object.entries(catalogue)) {
    const description = toHtml(entry);
    const { data, error } = await sb
      .from("products")
      .update({ description, updated_at: new Date().toISOString() })
      .eq("handle", handle)
      .select("handle");

    if (error) {
      console.error(handle, error.message);
      continue;
    }
    if (!data?.length) {
      missing++;
      continue;
    }
    updated++;
    console.log(`✓ ${handle}`);
  }

  console.log(`Updated ${updated} products. Handles not in DB: ${missing}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
