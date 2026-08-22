"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { usableProductImageUrls } from "@/lib/productImages";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const valid = useMemo(() => usableProductImageUrls(images), [images]);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [active, setActive] = useState(0);

  const usable = useMemo(
    () => valid.filter((src) => !failed.has(src)),
    [valid, failed],
  );
  const index = usable.length ? Math.min(active, usable.length - 1) : 0;
  const current = usable[index];

  function markFailed(src: string) {
    setFailed((prev) => {
      if (prev.has(src)) return prev;
      const next = new Set(prev);
      next.add(src);
      return next;
    });
  }

  if (!usable.length || !current) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg border border-brand-border bg-slate-50 text-sm text-brand-muted">
        No image available
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg border border-brand-border bg-slate-50">
        <Image
          src={current}
          alt={title}
          fill
          priority
          unoptimized
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-contain p-4"
          onError={() => markFailed(current)}
        />
      </div>
      {usable.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {usable.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border ${
                i === index ? "border-brand" : "border-brand-border"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                unoptimized
                className="object-contain p-1"
                sizes="64px"
                onError={() => markFailed(src)}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
