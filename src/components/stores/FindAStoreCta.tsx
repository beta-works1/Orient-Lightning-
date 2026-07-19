import { MotionLink } from "@/components/motion/Reveal";

/** Compact homepage CTA — links to the store locator. */
export function FindAStoreCta() {
  return (
    <section className="border-y border-brand-border/60 bg-brand-ice/50 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:text-left">
        <div>
          <h2 className="font-sans text-xl font-bold text-brand-navy sm:text-2xl">
            Find a Store Near You
          </h2>
          <p className="mt-1 text-sm text-brand-muted">
            Map, directions, and contact details for Orient Lighting locations.
          </p>
        </div>
        <MotionLink
          href="/stores"
          className="inline-flex min-h-[44px] shrink-0 items-center rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy"
        >
          Find a Store
        </MotionLink>
      </div>
    </section>
  );
}
