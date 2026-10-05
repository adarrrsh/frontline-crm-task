import { DEMO_LOCATIONS } from '@/data/demoLocations';
import { distanceKm } from '@/domain/geo';
import { useAppStore } from '@/store/useAppStore';
import { useLocationStore } from '@/store/useLocationStore';

const NAMED_AREA_RADIUS_KM = 20;

/** Friendly name for a coordinate: the nearest demo area, or "you". */
export function placeNameFor(coords) {
  let best = null;
  for (const l of DEMO_LOCATIONS) {
    const d = distanceKm(coords, l.coords);
    if (!best || d < best.d) best = { name: l.name, d };
  }
  return best && best.d <= NAMED_AREA_RADIUS_KM ? best.name : 'you';
}

/** Manual location when the worker chose one, otherwise the device fix. */
export function useEffectiveLocation() {
  const mode = useAppStore((s) => s.locationMode);
  const manual = useAppStore((s) => s.manualLocation);
  const status = useLocationStore((s) => s.status);
  const deviceCoords = useLocationStore((s) => s.coords);
  const lastTriedAt = useLocationStore((s) => s.lastTriedAt);

  if (mode === 'manual' && manual) {
    return {
      coords: manual.coords,
      source: 'manual',
      status,
      placeName: manual.name,
      lastTriedAt,
    };
  }
  const coords = status === 'granted' ? deviceCoords : null;
  return {
    coords,
    source: 'device',
    status,
    placeName: coords ? placeNameFor(coords) : '',
    lastTriedAt,
  };
}
