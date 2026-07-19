"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import {
  appleMapsDirectionsUrl,
  formatDistanceKm,
  googleMapsDirectionsUrl,
  sortDealersByDistance,
  type Dealer,
  type DealerWithDistance,
} from "@/lib/dealers";
import { MotionLink } from "@/components/motion/Reveal";

const StoreMap = dynamic(() => import("./StoreMap").then((m) => m.StoreMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-brand-border bg-brand-ice text-sm text-brand-muted">
      Loading map…
    </div>
  ),
});

type GeoStatus = "idle" | "loading" | "granted" | "denied" | "unavailable";

function typeLabel(type: Dealer["type"]) {
  return type === "flagship" ? "Flagship" : "Authorized dealer";
}

export function StoreLocator({ dealers }: { dealers: Dealer[] }) {
  const verifiedFirst = useMemo(
    () => [...dealers].sort((a, b) => Number(b.verified) - Number(a.verified)),
    [dealers],
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    verifiedFirst.find((d) => d.verified)?.id ?? dealers[0]?.id ?? null,
  );
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");

  const placeholderCount = dealers.filter((d) => !d.verified).length;

  const listed: DealerWithDistance[] = useMemo(() => {
    if (!userLocation) {
      return verifiedFirst.map((d) => ({ ...d, distanceKm: null }));
    }
    return sortDealersByDistance(dealers, userLocation.lat, userLocation.lng);
  }, [dealers, verifiedFirst, userLocation]);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("granted");
      },
      () => {
        setGeoStatus("denied");
        setUserLocation(null);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60_000 },
    );
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
      <div className="space-y-4">
        {placeholderCount > 0 ? (
          <div
            role="status"
            className="rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            <strong className="font-semibold">{placeholderCount} unverified placeholders</strong> are
            shown for layout testing only. Replace or remove them before this page goes to real
            customers.
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={requestLocation}
            disabled={geoStatus === "loading"}
            className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
          >
            {geoStatus === "loading" ? "Locating…" : "Use my location"}
          </button>
          {geoStatus === "granted" ? (
            <p className="text-sm text-brand-muted">Sorted nearest first.</p>
          ) : null}
          {geoStatus === "denied" ? (
            <p className="text-sm text-brand-muted">
              Location access denied — showing the full list unsorted. Enable location for
              nearest-first sorting.
            </p>
          ) : null}
          {geoStatus === "unavailable" ? (
            <p className="text-sm text-brand-muted">
              Geolocation isn&apos;t available in this browser. Showing the full list.
            </p>
          ) : null}
          {geoStatus === "idle" ? (
            <p className="text-sm text-brand-muted">Enable location to sort by distance to you.</p>
          ) : null}
        </div>

        <ul className="max-h-[min(70vh,640px)] space-y-3 overflow-y-auto pr-1" role="list">
          {listed.map((dealer) => {
            const active = dealer.id === selectedId;
            const mapsUrl = googleMapsDirectionsUrl(dealer.latitude, dealer.longitude);
            const appleUrl = appleMapsDirectionsUrl(dealer.latitude, dealer.longitude);
            return (
              <li key={dealer.id}>
                <article
                  className={`rounded-2xl border p-5 transition ${
                    active
                      ? "border-brand bg-white shadow-sm"
                      : "border-brand-border bg-white hover:border-brand/40"
                  } ${!dealer.verified ? "border-dashed border-amber-300/70" : ""}`}
                >
                  <button
                    type="button"
                    className="w-full cursor-pointer text-left"
                    onClick={() => {
                      setSelectedId(dealer.id);
                      window.open(mapsUrl, "_blank", "noopener,noreferrer");
                    }}
                    aria-pressed={active}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                            {typeLabel(dealer.type)}
                            {dealer.city ? ` · ${dealer.city}` : null}
                          </p>
                          {dealer.verified ? (
                            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                              Verified
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                              Unverified
                            </span>
                          )}
                        </div>
                        <h2 className="mt-1 font-sans text-lg font-bold text-brand-navy">
                          {dealer.name}
                        </h2>
                      </div>
                      {dealer.distanceKm != null ? (
                        <span className="rounded-full bg-brand-ice px-3 py-1 text-xs font-semibold text-brand">
                          {formatDistanceKm(dealer.distanceKm)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-brand-dark">{dealer.address}</p>
                    {dealer.hours ? (
                      <p className="mt-2 text-sm text-brand-muted">{dealer.hours}</p>
                    ) : null}
                    {!dealer.verified ? (
                      <p className="mt-2 text-xs text-amber-800">
                        Placeholder address for development — not a confirmed Orient Lighting
                        location.
                      </p>
                    ) : dealer.isWalkIn ? (
                      <p className="mt-2 text-xs font-medium text-brand">
                        Head office &amp; showroom — call ahead if visiting.
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-brand-muted">
                        Please call or WhatsApp before visiting.
                      </p>
                    )}
                  </button>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[40px] items-center rounded-full bg-brand px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-navy"
                    >
                      Google Maps
                    </a>
                    <a
                      href={appleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[40px] items-center rounded-full border border-brand/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand hover:bg-brand-off"
                    >
                      Apple Maps
                    </a>
                    {dealer.phone ? (
                      <a
                        href={`tel:${dealer.phone.replace(/\s/g, "")}`}
                        className="inline-flex min-h-[40px] items-center rounded-full border border-brand-border px-4 py-2 text-xs font-semibold text-brand-navy hover:border-brand"
                      >
                        Call
                      </a>
                    ) : null}
                    {dealer.whatsapp ? (
                      <a
                        href={`https://wa.me/${dealer.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[40px] items-center rounded-full border border-brand-border px-4 py-2 text-xs font-semibold text-brand-navy hover:border-brand"
                      >
                        WhatsApp
                      </a>
                    ) : null}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-brand-muted">
          Dealer network growing —{" "}
          <MotionLink
            href="/pages/become-our-partner"
            className="font-medium text-brand underline-offset-2 hover:underline"
          >
            become a partner
          </MotionLink>{" "}
          to list your shop here.
        </p>
      </div>

      <div className="sticky top-24 h-[min(70vh,560px)]">
        <StoreMap
          dealers={dealers}
          selectedId={selectedId}
          onSelect={setSelectedId}
          userLocation={userLocation}
        />
        <p className="mt-2 text-center text-[11px] text-brand-muted">
          Blue pins = verified · Amber pins = unverified placeholders. Tap a pin for Google Maps
          directions.
        </p>
      </div>
    </div>
  );
}
