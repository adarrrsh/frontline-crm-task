import type { Coordinates } from './types';

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in km (haversine). */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "0.4 km", "1.5 km", "12 km" */
export function formatDistance(km: number): string {
  if (km < 10) return `${(Math.round(km * 10) / 10).toFixed(1).replace(/\.0$/, '')} km`;
  return `${Math.round(km)} km`;
}
