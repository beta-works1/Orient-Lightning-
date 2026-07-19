export type DealerType = "flagship" | "authorized_dealer";

export type Dealer = {
  id: string;
  name: string;
  type: DealerType;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  whatsapp: string | null;
  hours: string | null;
  /**
   * false = placeholder for layout/testing only.
   * Must be replaced or removed before production.
   */
  verified: boolean;
  /** Confirmed walk-in retail access (only meaningful when verified). */
  isWalkIn: boolean;
};

export type DealerWithDistance = Dealer & { distanceKm: number | null };

/** Haversine distance in kilometres. */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function sortDealersByDistance(
  dealers: Dealer[],
  lat: number,
  lng: number,
): DealerWithDistance[] {
  return dealers
    .map((d) => ({
      ...d,
      distanceKm: haversineKm(lat, lng, d.latitude, d.longitude),
    }))
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
}

export function googleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function appleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://maps.apple.com/?daddr=${lat},${lng}`;
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
