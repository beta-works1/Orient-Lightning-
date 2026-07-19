import type { Metadata } from "next";
import { StoreLocator } from "@/components/stores/StoreLocator";
import { getDealers } from "@/lib/dealers-data";
import { SITE } from "@/lib/types";

export const metadata: Metadata = {
  title: "Find a Store",
  description: `Find your nearest ${SITE.name} location. Get directions on Google Maps or Apple Maps.`,
};

export default function StoresPage() {
  const dealers = getDealers();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <p className="type-kicker text-brand">Store locator</p>
        <h1 className="type-display mt-3 text-brand-navy">
          Find Your Nearest Orient Lighting Retailer
        </h1>
        <p className="type-body mt-4 text-brand-muted">
          Use your location to sort by distance, then open Google Maps or Apple Maps for
          turn-by-turn directions.
        </p>
      </header>

      <div className="mt-10">
        <StoreLocator dealers={dealers} />
      </div>
    </div>
  );
}
