"use client";

import { useMemo, useState } from "react";
import type { Product, ProductVariant } from "@/lib/types";
import {
  ROOM_TYPES,
  calcBulbsNeeded,
  calcRequiredLumens,
  getProductLumens,
  type RoomTypeId,
} from "@/lib/lightingCalc";

type Mode = "dimensions" | "area";

export function BulbCalculator({
  product,
  variant,
}: {
  product: Product;
  variant?: ProductVariant | null;
}) {
  const [mode, setMode] = useState<Mode>("dimensions");
  const [lengthFt, setLengthFt] = useState("12");
  const [widthFt, setWidthFt] = useState("10");
  const [areaSqFt, setAreaSqFt] = useState("120");
  const [roomType, setRoomType] = useState<RoomTypeId>("living");

  const room = ROOM_TYPES.find((r) => r.id === roomType) || ROOM_TYPES[0];
  const { lumens, source, watts } = getProductLumens(product, variant);

  const result = useMemo(() => {
    const length = Number(lengthFt);
    const width = Number(widthFt);
    const areaInput = Number(areaSqFt);

    const area =
      mode === "dimensions"
        ? Number.isFinite(length) && Number.isFinite(width) && length > 0 && width > 0
          ? length * width
          : null
        : Number.isFinite(areaInput) && areaInput > 0
          ? areaInput
          : null;

    if (area == null || !lumens) return null;

    const required = calcRequiredLumens(area, room.footCandles);
    const count = calcBulbsNeeded(required, lumens);

    return { area, required, count, lumens };
  }, [mode, lengthFt, widthFt, areaSqFt, room.footCandles, lumens]);

  if (!lumens) {
    return (
      <div className="rounded-lg border border-dashed border-brand-border bg-slate-50 p-4 text-sm text-brand-muted">
        Room calculator unavailable for this product (no wattage or lumen rating found).
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-brand-border bg-slate-50/80 p-4">
      <h3 className="font-display text-lg text-brand-navy">How many do I need?</h3>
      <p className="mt-1 text-xs text-brand-muted">
        Enter room size to estimate quantity from lumen target
        {source === "estimated" && watts
          ? ` (~${lumens.toLocaleString()} lm estimated from ${watts}W)`
          : ` (${lumens.toLocaleString()} lm per unit)`}
        .
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("dimensions")}
          className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
            mode === "dimensions"
              ? "border-brand bg-brand text-white"
              : "border-brand-border text-brand-navy hover:border-brand"
          }`}
        >
          Length × Width (ft)
        </button>
        <button
          type="button"
          onClick={() => setMode("area")}
          className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
            mode === "area"
              ? "border-brand bg-brand text-white"
              : "border-brand-border text-brand-navy hover:border-brand"
          }`}
        >
          Area (sq ft)
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {mode === "dimensions" ? (
          <>
            <label className="block text-xs font-medium text-brand-navy">
              Length (ft)
              <input
                type="number"
                min="1"
                step="0.1"
                value={lengthFt}
                onChange={(e) => setLengthFt(e.target.value)}
                className="mt-1 w-full rounded-md border border-brand-border bg-white px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand"
              />
            </label>
            <label className="block text-xs font-medium text-brand-navy">
              Width (ft)
              <input
                type="number"
                min="1"
                step="0.1"
                value={widthFt}
                onChange={(e) => setWidthFt(e.target.value)}
                className="mt-1 w-full rounded-md border border-brand-border bg-white px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand"
              />
            </label>
          </>
        ) : (
          <label className="block text-xs font-medium text-brand-navy sm:col-span-2">
            Room area (sq ft)
            <input
              type="number"
              min="1"
              step="1"
              value={areaSqFt}
              onChange={(e) => setAreaSqFt(e.target.value)}
              className="mt-1 w-full rounded-md border border-brand-border bg-white px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand"
            />
          </label>
        )}

        <label className="block text-xs font-medium text-brand-navy sm:col-span-2">
          Room type
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value as RoomTypeId)}
            className="mt-1 w-full rounded-md border border-brand-border bg-white px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand"
          >
            {ROOM_TYPES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label} (~{r.footCandles} fc)
              </option>
            ))}
          </select>
        </label>
      </div>

      {result ? (
        <div className="mt-4 rounded-md border border-brand/20 bg-white p-4">
          <p className="text-sm text-brand-dark">
            Room: <span className="font-semibold">{result.area.toLocaleString()} sq ft</span>
            {" · "}
            Target: <span className="font-semibold">{result.required.toLocaleString()} lumens</span>
          </p>
          <p className="mt-2 font-display text-3xl text-brand">
            {result.count}{" "}
            <span className="text-lg font-sans font-semibold text-brand-navy">
              {result.count === 1 ? "unit needed" : "units needed"}
            </span>
          </p>
          <p className="mt-1 text-xs text-brand-muted">
            Based on {result.lumens.toLocaleString()} lm per unit
            {source === "estimated" ? " (estimated)" : ""} and {room.label.toLowerCase()} lighting level.
            Actual needs vary with ceiling height, paint color, and fixture placement.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-brand-muted">Enter a valid room size to see the estimate.</p>
      )}
    </div>
  );
}
