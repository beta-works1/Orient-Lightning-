import assert from "node:assert/strict";
import { test } from "node:test";
import type { CatalogueEntry } from "../src/lib/catalogueSpecs";
import {
  parseCatalogueFromDescription,
  getCatalogueEntry,
  resolveCatalogueSpecs,
} from "../src/lib/catalogueSpecs";
import {
  buildCompareSummaryPrompt,
  compareSummaryRulesBlock,
  findMentionedProducts,
  looksLikeCompareQuestion,
} from "../src/lib/compare/prompt";
import {
  buildCompareSpecSlice,
  formatCompareDigestLine,
  formatCompareSpecBlock,
  extraCompareTableRows,
  type CompareProductLike,
} from "../src/lib/compare/specSlice";
import { buildChatCompareAppendix, buildSystemPrompt } from "../src/lib/chat/productContext";

function dummyProduct(
  handle: string,
  title: string,
  extra: Partial<CompareProductLike> = {},
): CompareProductLike {
  return {
    handle,
    title,
    price: 1000,
    productType: "LED",
    sku: handle.toUpperCase(),
    ...extra,
  };
}

const dieCast: CatalogueEntry = {
  handle: "industrial-high-bay",
  series: "UFO High Bay",
  sourcePage: "p.18",
  blurb: "Industrial high bays for factories.",
  rows: [
    {
      model: "OL-HB100",
      watts: 100,
      wattsLabel: "100W",
      lumens: 14000,
      lumensLabel: "14,000 lm",
      notes: "140 lm/W · CCT 4000K",
    },
  ],
  colorTemps: ["4000"],
  features: ["Die-cast aluminium housing", "IP66 waterproof", "IK08 impact resistance"],
  electrical: ["PF 0.9", "CRI ≥80", "Voltage 85–256V", "Life 50,000 H", "Beam 120°"],
  applications: ["Factories", "Warehouses"],
  warranty: "2 years",
};

const polyHome: CatalogueEntry = {
  handle: "home-bulb",
  series: "Carol Bulb",
  sourcePage: "p.4",
  blurb: "Everyday residential bulb.",
  rows: [
    {
      model: "OL-BA12C",
      watts: 12,
      wattsLabel: "12W",
      lumens: 1140,
      lumensLabel: "1,140 lm",
      notes: "95 lm/W",
    },
  ],
  colorTemps: ["3000", "6500"],
  features: ["Polycarbonate housing", "E27 / B22 base"],
  electrical: ["PF 0.5", "IP20", "CRI ≥80", "Voltage 85–256V"],
  applications: ["Home", "Shop"],
  warranty: "1 year",
};

test("spec slice maps housing, lumens, PF, application from catalogue keys", () => {
  const a = buildCompareSpecSlice(dummyProduct("industrial-high-bay", "UFO High Bay"), dieCast);
  const b = buildCompareSpecSlice(dummyProduct("home-bulb", "Carol Bulb"), polyHome);

  assert.match(a.housing || "", /die-cast aluminium/i);
  assert.match(a.luminousOutput || "", /14,000 lm/);
  assert.match(a.luminousOutput || "", /140 lm\/W/);
  assert.match(a.powerFactor || "", /PF 0\.9/);
  assert.match(a.applications || "", /Factories/);

  assert.match(b.housing || "", /polycarbonate housing/i);
  assert.match(b.luminousOutput || "", /1,140 lm/);
  assert.match(b.powerFactor || "", /PF 0\.5/);
  assert.match(b.applications || "", /Home/);
});

test("prompt payload cites dummy contrasts and forbids identical fluff", () => {
  const prompt = buildCompareSummaryPrompt(
    [
      dummyProduct("industrial-high-bay", "UFO High Bay"),
      dummyProduct("home-bulb", "Carol Bulb"),
    ],
    [dieCast, polyHome],
  );

  assert.match(prompt, /Housing material: Die-cast aluminium housing/);
  assert.match(prompt, /Housing material: Polycarbonate housing/);
  assert.match(prompt, /Luminous output:.*14,000 lm/);
  assert.match(prompt, /Luminous output:.*1,140 lm/);
  assert.match(prompt, /Power factor: PF 0\.9/);
  assert.match(prompt, /Power factor: PF 0\.5/);
  assert.match(prompt, /Application: Factories, Warehouses/);
  assert.match(prompt, /Application: Home, Shop/);

  assert.match(prompt, /Lead with how they differ/);
  assert.match(prompt, /Do not mention a spec that is identical/);
  assert.match(prompt, /Never invent/);
  assert.match(prompt, /not listed/);
  assert.match(prompt, /N-way contrasts/);
  assert.match(prompt, /No shared marketing adjectives/);
});

test("missing housing is marked not listed rather than invented", () => {
  const noHousing: CatalogueEntry = {
    ...polyHome,
    features: ["Wide 270° beam"],
  };
  const slice = buildCompareSpecSlice(dummyProduct("home-bulb", "Carol Bulb"), noHousing);
  assert.equal(slice.housing, null);
  const block = formatCompareSpecBlock(slice);
  assert.match(block, /Housing material: not listed/);
  assert.doesNotMatch(block, /die-cast|aluminium housing/i);
});

test("HTML description fallback extracts features, electrical, applications", () => {
  const html = `
    <p><strong>Ignis Panel</strong> — from Orient Lighting Catalogue 2026–27 (p.10).</p>
    <p>Rimless surface panel for offices.</p>
    <p><strong>Catalogue specifications</strong></p>
    <table><tbody>
      <tr><td>OL-IG18</td><td>18W</td><td>1,800 lm</td><td>100 lm/W</td></tr>
    </tbody></table>
    <p><strong>Features</strong></p>
    <ul><li>Polycarbonate housing &amp; diffuser</li><li>Surface-mounted</li></ul>
    <p><strong>Electrical &amp; performance</strong></p>
    <ul><li>PF 0.7</li><li>IP20</li><li>CRI ≥80</li></ul>
    <p><strong>Applications</strong></p>
    <p>Office, Shop</p>
    <p><strong>Warranty:</strong> 1 year</p>
  `;
  const parsed = parseCatalogueFromDescription(html);
  assert.ok(parsed);
  assert.equal(parsed!.rows[0]?.watts, 18);
  assert.equal(parsed!.rows[0]?.lumens, 1800);
  assert.ok(parsed!.features.some((f) => /polycarbonate housing/i.test(f)));
  assert.ok(parsed!.electrical.some((e) => /PF 0\.7/.test(e)));
  assert.deepEqual(parsed!.applications, ["Office", "Shop"]);
  assert.match(parsed!.warranty || "", /1 year/);

  const fromDesc = buildCompareSpecSlice(
    dummyProduct("ignis-html-unmapped", "Ignis Panel", { description: html }),
  );
  assert.match(fromDesc.housing || "", /polycarbonate housing/i);
  assert.match(fromDesc.powerFactor || "", /PF 0\.7/);
  assert.match(fromDesc.applications || "", /Office/);
  assert.match(fromDesc.luminousOutput || "", /1,800 lm/);
});

test("UFO vs Candy still gets housing/lm/PF/application when description is empty (JSON fallback)", () => {
  const highBay = resolveCatalogueSpecs("ufo-high-bay-light", "");
  const candy = resolveCatalogueSpecs("ol-12-watt-candy-led-bulbs-cp-67", "");
  assert.ok(highBay && candy);
  assert.match(highBay.features.join(" "), /Die-cast aluminium housing/i);
  assert.ok(highBay.electrical.some((e) => /PF 0\.9/.test(e)));
  assert.ok(highBay.applications.includes("Factories"));
  assert.equal(highBay.rows[0]?.lumens, 14000);
  assert.ok(candy.electrical.some((e) => /PF 0\.5/.test(e)));
  assert.ok(candy.applications.includes("Home"));
  assert.equal(candy.rows[0]?.lumens, 285);

  const prompt = buildCompareSummaryPrompt([
    dummyProduct("ufo-high-bay-light", "UFO High Bay Light"),
    dummyProduct("ol-12-watt-candy-led-bulbs-cp-67", "Candy LED Bulb"),
  ]);

  assert.match(prompt, /Die-cast aluminium housing/i);
  assert.match(prompt, /PF 0\.9/);
  assert.match(prompt, /Factories/);
  assert.match(prompt, /14,000 lm/);
  assert.match(prompt, /PF 0\.5/);
  assert.match(prompt, /Home/);
  assert.match(prompt, /285 lm/);
});

test("live DB description overrides older JSON housing/lumens/PF/application for the same handle", () => {
  const handle = "ufo-high-bay-light";
  const stale = getCatalogueEntry(handle);
  assert.ok(stale);
  assert.ok(stale.features.some((f) => /Die-cast aluminium housing/i.test(f)));
  assert.ok(stale.electrical.some((e) => /^PF 0\.9$/.test(e)));
  assert.ok(stale.applications.includes("Factories"));
  assert.equal(stale.rows[0]?.lumens, 14000);

  const liveHtml = `
    <p><strong>LED High Bay Light (UFO)</strong> — from Orient Lighting Catalogue 2026–27 (p.18).</p>
    <p>Updated industrial high bay for hospitals and clean rooms.</p>
    <p><strong>Catalogue specifications</strong></p>
    <table><tbody>
      <tr><td>OL-HB100R</td><td>100W</td><td>16,000 lm</td><td>160 lm/W</td></tr>
    </tbody></table>
    <p><strong>Features</strong></p>
    <ul><li>ADC12 extruded aluminium housing</li><li>Surface-mounted</li></ul>
    <p><strong>Electrical &amp; performance</strong></p>
    <ul><li>PF 0.95</li><li>IP66</li></ul>
    <p><strong>Applications</strong></p>
    <p>Hospitals, Clean rooms</p>
  `;

  const slice = buildCompareSpecSlice(
    dummyProduct(handle, "UFO High Bay Light", { description: liveHtml }),
  );
  assert.match(slice.housing || "", /ADC12 extruded aluminium housing/i);
  assert.doesNotMatch(slice.housing || "", /Die-cast aluminium housing/i);
  assert.match(slice.luminousOutput || "", /16,000 lm/);
  assert.doesNotMatch(slice.luminousOutput || "", /14,000 lm/);
  assert.match(slice.powerFactor || "", /PF 0\.95/);
  assert.doesNotMatch(slice.powerFactor || "", /PF 0\.9(?!5)/);
  assert.match(slice.applications || "", /Hospitals/);
  assert.doesNotMatch(slice.applications || "", /Factories/);

  const prompt = buildCompareSummaryPrompt([
    dummyProduct(handle, "UFO High Bay Light", { description: liveHtml }),
    dummyProduct("ol-12-watt-candy-led-bulbs-cp-67", "Candy LED Bulb"),
  ]);
  assert.match(prompt, /ADC12 extruded aluminium housing/);
  assert.doesNotMatch(prompt, /Die-cast aluminium housing/);
  assert.match(prompt, /16,000 lm/);
  assert.match(prompt, /PF 0\.95/);
  assert.match(prompt, /Hospitals/);
});

test("chat digest and compare appendix reuse the same spec fields", () => {
  const slice = buildCompareSpecSlice(dummyProduct("industrial-high-bay", "UFO High Bay"), dieCast);
  const line = formatCompareDigestLine(slice);
  assert.match(line, /housing:Die-cast aluminium housing/);
  assert.match(line, /pf:PF 0\.9/);
  assert.match(line, /app:Factories, Warehouses/);
  assert.match(line, /lumens:.*14,000 lm/);

  const system = buildSystemPrompt("catalogue stub");
  assert.match(system, /Lead with how they differ/);

  const products = [
    dummyProduct("industrial-high-bay", "UFO High Bay Light Industrial"),
    dummyProduct("home-bulb", "Carol Everyday Home Bulb"),
  ];
  const appendix = buildChatCompareAppendix(
    products,
    "Compare UFO High Bay Light Industrial vs Carol Everyday Home Bulb",
    ["industrial-high-bay", "home-bulb"],
  );
  assert.match(appendix, /Housing material/);
  assert.match(appendix, /Power factor/);
  assert.equal(looksLikeCompareQuestion("which one is better for a warehouse"), true);
  assert.equal(findMentionedProducts("see /products/home-bulb please", products).length, 1);
});

test("compare table extra rows include housing and PF when present", () => {
  const rows = extraCompareTableRows([
    buildCompareSpecSlice(dummyProduct("industrial-high-bay", "UFO High Bay"), dieCast),
    buildCompareSpecSlice(dummyProduct("home-bulb", "Carol Bulb"), polyHome),
  ]);
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
  assert.ok(byKey.housing);
  assert.match(byKey.housing.values[0], /die-cast/i);
  assert.match(byKey.housing.values[1], /polycarbonate/i);
  assert.match(byKey.powerFactor.values[0], /0\.9/);
  assert.match(byKey.applications.values[1], /Home/);
});

test("compareSummaryRulesBlock is the shared instruction text", () => {
  const rules = compareSummaryRulesBlock();
  assert.match(rules, /housing material/i);
  assert.match(rules, /power factor/i);
  assert.match(rules, /identical across all selected products/);
});
