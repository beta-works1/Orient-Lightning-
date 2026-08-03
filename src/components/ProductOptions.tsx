"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product, ProductVariant } from "@/lib/types";
import {
  findCatalogueRow,
  resolveCatalogueSpecs,
  type CatalogueSpecRow,
} from "@/lib/catalogueSpecs";
import {
  findVariantId,
  initialSelections,
  parseVariants,
  reconcileSelections,
  toneHint,
  toneLabel,
  uniqueSorted,
  type LightTone,
  type OptionSelections,
  type ParsedVariant,
} from "@/lib/productOptions";

function Chip({
  active,
  onClick,
  children,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className={`rounded-full border px-3.5 py-2 text-sm transition ${
        active
          ? "border-brand bg-brand text-white shadow-sm"
          : "border-brand-border bg-white text-brand-navy hover:border-brand"
      }`}
    >
      {children}
    </button>
  );
}

function OptionGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-brand-navy">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function availableFor(
  parsed: ParsedVariant[],
  sel: OptionSelections,
  unlock: (keyof OptionSelections)[],
): ParsedVariant[] {
  const soft: OptionSelections = { ...sel };
  for (const k of unlock) soft[k] = null;
  return parsed.filter((p) => {
    if (soft.shape && p.shape !== soft.shape) return false;
    if (soft.size && p.size !== soft.size) return false;
    if (soft.wattage && p.wattage !== soft.wattage) return false;
    if (soft.tone && p.tone !== soft.tone) return false;
    if (soft.colorTemp && p.colorTemp !== soft.colorTemp) return false;
    if (soft.base && p.base !== soft.base) return false;
    return true;
  });
}

function colorTempChipLabel(tone: LightTone | null, kelvin: string | null): string {
  if (tone && kelvin) return `${toneLabel(tone)}/${kelvin}K`;
  if (tone) return toneLabel(tone);
  if (kelvin) return `${kelvin}K`;
  return "";
}

function CatalogueSummary({
  series,
  sourcePage,
  row,
  colorTemp,
  tone,
}: {
  series: string;
  sourcePage: string;
  row: CatalogueSpecRow | null;
  colorTemp: string | null;
  tone: LightTone | null;
}) {
  if (!row && !series) return null;

  const lightLabel = colorTempChipLabel(tone, colorTemp);

  return (
    <div className="rounded-lg border border-brand/20 bg-white px-3.5 py-3 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">
        Catalogue specs{sourcePage ? ` · ${sourcePage}` : ""}
      </p>
      {series ? <p className="mt-1 font-medium text-brand-navy">{series}</p> : null}
      {row ? (
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-brand-navy sm:grid-cols-4">
          {row.model ? (
            <div>
              <dt className="text-[11px] text-brand-muted">Model</dt>
              <dd className="font-semibold">{row.model}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-[11px] text-brand-muted">Wattage</dt>
            <dd className="font-semibold">{row.wattsLabel}</dd>
          </div>
          {row.lumensLabel ? (
            <div>
              <dt className="text-[11px] text-brand-muted">Lumens</dt>
              <dd className="font-semibold">{row.lumensLabel}</dd>
            </div>
          ) : null}
          {lightLabel ? (
            <div>
              <dt className="text-[11px] text-brand-muted">Color temperature</dt>
              <dd className="font-semibold">{lightLabel}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}

export function ProductOptions({
  product,
  onVariantChange,
}: {
  product: Product;
  onVariantChange: (variant: ProductVariant | undefined) => void;
}) {
  const parsed = useMemo(() => parseVariants(product), [product]);
  const catalogue = useMemo(
    () => resolveCatalogueSpecs(product.handle, product.description),
    [product.handle, product.description],
  );
  const lumenByWatt = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of catalogue?.rows || []) {
      if (row.lumensLabel) map.set(String(row.watts), row.lumensLabel);
    }
    return map;
  }, [catalogue]);

  const sizeByWatt = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of parsed) {
      const watt = p.wattage;
      const size = p.variant.size?.trim();
      if (watt && size && !map.has(watt)) map.set(watt, size);
    }
    return map;
  }, [parsed]);

  const [sel, setSel] = useState<OptionSelections>(() => initialSelections(parsed));

  useEffect(() => {
    setSel(initialSelections(parsed));
  }, [product.id, parsed]);

  useEffect(() => {
    const id = findVariantId(parsed, sel);
    onVariantChange(parsed.find((p) => p.variant.id === id)?.variant ?? parsed[0]?.variant);
  }, [parsed, sel, onVariantChange]);

  if (parsed.length === 0) return null;

  const showPicker = parsed.length > 1;
  if (!showPicker && !catalogue?.rows.length) return null;

  const hasShape = uniqueSorted(parsed, "shape").length > 1;
  const hasSize = uniqueSorted(parsed, "size").length > 1;
  const hasWatt =
    uniqueSorted(parsed, "wattage", true).length > 1 || (catalogue?.rows.length || 0) > 1;
  const hasTone = uniqueSorted(parsed, "tone").length > 1;
  const hasTemp = uniqueSorted(parsed, "colorTemp", true).length > 1;
  const hasBase = uniqueSorted(parsed, "base").length > 1;

  const structured = showPicker && (hasWatt || hasTone || hasTemp || hasShape || hasSize || hasBase);

  function pick<K extends keyof OptionSelections>(key: K, value: OptionSelections[K]) {
    setSel((prev) => reconcileSelections(parsed, { ...prev, [key]: value }));
  }

  const selectedRow = findCatalogueRow(catalogue, sel.wattage ?? catalogue?.rows[0]?.watts);

  if (!showPicker) {
    return catalogue ? (
      <div className="space-y-3 rounded-xl border border-brand-border bg-slate-50/70 p-4">
        <CatalogueSummary
          series={catalogue.series}
          sourcePage={catalogue.sourcePage}
          row={selectedRow}
          colorTemp={sel.colorTemp}
          tone={sel.tone}
        />
      </div>
    ) : null;
  }

  if (!structured) {
    return (
      <div className="space-y-3">
        <OptionGroup label="Options">
          {parsed.map((p) => (
            <Chip
              key={p.variant.id}
              active={findVariantId(parsed, sel) === p.variant.id}
              onClick={() =>
                setSel({
                  shape: p.shape,
                  size: p.size,
                  wattage: p.wattage,
                  tone: p.tone,
                  colorTemp: p.colorTemp,
                  base: p.base,
                })
              }
            >
              {p.variant.title}
            </Chip>
          ))}
        </OptionGroup>
        {catalogue ? (
          <CatalogueSummary
            series={catalogue.series}
            sourcePage={catalogue.sourcePage}
            row={selectedRow}
            colorTemp={sel.colorTemp}
            tone={sel.tone}
          />
        ) : null}
      </div>
    );
  }

  const shapes = uniqueSorted(
    availableFor(parsed, sel, ["shape", "size", "wattage", "tone", "colorTemp", "base"]),
    "shape",
  );
  const sizes = uniqueSorted(
    availableFor(parsed, sel, ["size", "wattage", "tone", "colorTemp", "base"]),
    "size",
    true,
  );
  const watts = uniqueSorted(
    availableFor(parsed, sel, ["wattage", "tone", "colorTemp", "base"]),
    "wattage",
    true,
  );
  const tones = uniqueSorted(
    availableFor(parsed, sel, ["tone", "colorTemp", "base"]),
    "tone",
  ) as LightTone[];
  const temps = uniqueSorted(
    availableFor(parsed, sel, ["colorTemp", "base"]),
    "colorTemp",
    true,
  );
  const bases = uniqueSorted(availableFor(parsed, sel, ["base"]), "base");

  // Unique tone+kelvin pairs from currently available variants
  const colorOptions = availableFor(parsed, sel, ["tone", "colorTemp", "base"])
    .map((p) => ({
      tone: p.tone,
      colorTemp: p.colorTemp,
      label: colorTempChipLabel(p.tone, p.colorTemp),
    }))
    .filter((o) => o.label);
  const seenColor = new Set<string>();
  const uniqueColors = colorOptions.filter((o) => {
    const key = `${o.tone ?? ""}|${o.colorTemp ?? ""}`;
    if (seenColor.has(key)) return false;
    seenColor.add(key);
    return true;
  });
  // Prefer tone order then kelvin
  uniqueColors.sort((a, b) => {
    const toneOrder = ["Warm", "Natural", "Daylight"];
    const ta = a.tone ? toneOrder.indexOf(a.tone) : 99;
    const tb = b.tone ? toneOrder.indexOf(b.tone) : 99;
    if (ta !== tb) return ta - tb;
    return Number(a.colorTemp || 0) - Number(b.colorTemp || 0);
  });

  const hasColor = uniqueColors.length > 1 || (hasTone && tones.length > 0) || (hasTemp && temps.length > 0);

  return (
    <div className="space-y-4 rounded-xl border border-brand-border bg-slate-50/70 p-4">
      <div>
        <p className="text-sm font-semibold text-brand-navy">Choose your options</p>
        <p className="mt-0.5 text-xs text-brand-muted">
          Specs from Orient Lighting Catalogue 2026–27
          {catalogue?.sourcePage ? ` (${catalogue.sourcePage})` : ""}.
        </p>
      </div>

      {hasShape && shapes.length > 1 ? (
        <OptionGroup label="Style">
          {shapes.map((s) => (
            <Chip key={s} active={sel.shape === s} onClick={() => pick("shape", s)}>
              {s}
            </Chip>
          ))}
        </OptionGroup>
      ) : null}

      {hasSize && sizes.length > 1 ? (
        <OptionGroup label="Size">
          {sizes.map((s) => (
            <Chip key={s} active={sel.size === s} onClick={() => pick("size", s)}>
              {s}
            </Chip>
          ))}
        </OptionGroup>
      ) : null}

      {hasWatt && watts.length > 0 ? (
        <OptionGroup label="Wattage">
          {watts.map((w) => {
            const lm = lumenByWatt.get(w);
            const size = sizeByWatt.get(w);
            const hint = [lm, size ? `Size: ${size}` : null].filter(Boolean).join(" · ") || undefined;
            return (
              <Chip
                key={w}
                active={sel.wattage === w}
                onClick={() => pick("wattage", w)}
                hint={hint}
              >
                <span className="inline-flex flex-col items-start leading-tight">
                  <span>{w}W</span>
                  {lm ? (
                    <span className={`text-[10px] ${sel.wattage === w ? "text-white/80" : "text-brand-muted"}`}>
                      {lm}
                    </span>
                  ) : null}
                  {size ? (
                    <span className={`text-[10px] ${sel.wattage === w ? "text-white/80" : "text-brand-muted"}`}>
                      {size}
                    </span>
                  ) : null}
                </span>
              </Chip>
            );
          })}
        </OptionGroup>
      ) : null}

      {hasColor && uniqueColors.length > 0 ? (
        <OptionGroup label="Color temperature">
          {uniqueColors.map((o) => {
            const active =
              (o.tone ? sel.tone === o.tone : true) &&
              (o.colorTemp ? sel.colorTemp === o.colorTemp : true);
            return (
              <Chip
                key={`${o.tone}-${o.colorTemp}`}
                active={!!active}
                onClick={() =>
                  setSel((prev) =>
                    reconcileSelections(parsed, {
                      ...prev,
                      tone: o.tone,
                      colorTemp: o.colorTemp,
                    }),
                  )
                }
                hint={o.tone ? toneHint(o.tone) : undefined}
              >
                {o.label}
              </Chip>
            );
          })}
        </OptionGroup>
      ) : null}

      {hasBase && bases.length > 1 ? (
        <OptionGroup label="Base">
          {bases.map((b) => (
            <Chip key={b} active={sel.base === b} onClick={() => pick("base", b)}>
              {b}
            </Chip>
          ))}
        </OptionGroup>
      ) : null}

      {catalogue ? (
        <CatalogueSummary
          series={catalogue.series}
          sourcePage={catalogue.sourcePage}
          row={selectedRow}
          colorTemp={sel.colorTemp}
          tone={sel.tone}
        />
      ) : null}
    </div>
  );
}
