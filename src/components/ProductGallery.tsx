"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] || images[0];

  if (!images.length) {
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
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-contain p-4"
        />
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border ${
                i === active ? "border-brand" : "border-brand-border"
              }`}
            >
              <Image src={src} alt="" fill className="object-contain p-1" sizes="64px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
