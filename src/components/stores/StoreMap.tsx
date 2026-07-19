"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Dealer } from "@/lib/dealers";
import "leaflet/dist/leaflet.css";

type Props = {
  dealers: Dealer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation: { lat: number; lng: number } | null;
};

export function StoreMap({ dealers, selectedId, onSelect, userLocation }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = markersRef.current;
    if (!map || !group) return;

    group.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    dealers.forEach((d) => {
      const isSelected = d.id === selectedId;
      const color = d.verified ? "#0F428F" : "#B45309";
      const fill = isSelected ? (d.verified ? "#162950" : "#92400E") : color;
      const marker = L.circleMarker([d.latitude, d.longitude], {
        radius: isSelected ? 11 : d.verified ? 8 : 7,
        color,
        weight: 2,
        fillColor: fill,
        fillOpacity: d.verified ? 0.9 : 0.75,
      });
      const tip = d.verified ? d.name : `${d.name} (Unverified)`;
      marker.bindTooltip(tip, { direction: "top", offset: [0, -8] });
      marker.on("click", () => {
        onSelect(d.id);
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${d.latitude},${d.longitude}`,
          "_blank",
          "noopener,noreferrer",
        );
      });
      group.addLayer(marker);
      bounds.push([d.latitude, d.longitude]);
    });

    if (userLocation) {
      const you = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 7,
        color: "#162950",
        weight: 2,
        fillColor: "#ffffff",
        fillOpacity: 1,
      });
      you.bindTooltip("You are here", { direction: "top" });
      group.addLayer(you);
      bounds.push([userLocation.lat, userLocation.lng]);
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 14 });
    }

    requestAnimationFrame(() => map.invalidateSize());
  }, [dealers, selectedId, onSelect, userLocation]);

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[320px] w-full rounded-2xl border border-brand-border bg-brand-ice"
      role="img"
      aria-label="Map of Orient Lighting locations"
    />
  );
}
