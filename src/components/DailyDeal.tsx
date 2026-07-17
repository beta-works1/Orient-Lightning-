"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

function getEndOfDay(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function DailyDeal({ products }: { products: Product[] }) {
  const [remaining, setRemaining] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, getEndOfDay().getTime() - Date.now());
      const s = Math.floor(diff / 1000);
      setRemaining({
        d: Math.floor(s / 86400),
        h: Math.floor((s % 86400) / 3600),
        m: Math.floor((s % 3600) / 60),
        s: s % 60,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!products.length) return null;

  const cells = [
    { label: "Days", value: remaining.d },
    { label: "Hrs", value: remaining.h },
    { label: "Min", value: remaining.m },
    { label: "Sec", value: remaining.s },
  ];

  return (
    <section className="bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-sale">Daily Deal</p>
            <h2 className="font-display text-2xl text-brand-navy sm:text-3xl">Get 20% off each item!</h2>
          </div>
          <div className="flex gap-2">
            {cells.map((c) => (
              <div
                key={c.label}
                className="min-w-[58px] rounded-md bg-brand px-2 py-2 text-center text-white"
              >
                <div className="font-display text-xl leading-none">
                  {String(c.value).padStart(2, "0")}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-white/80">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
