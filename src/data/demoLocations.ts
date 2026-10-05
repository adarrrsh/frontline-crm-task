import type { Coordinates } from '@/domain/types';

export interface DemoLocation {
  id: string;
  name: string;
  county: string;
  coords: Coordinates;
}

/** The iOS Simulator's default location (Features → Location → Apple). */
export const APPLE_PARK: Coordinates = { latitude: 37.3349, longitude: -122.009 };
export const SAN_FRANCISCO: Coordinates = { latitude: 37.7749, longitude: -122.4194 };

export const DEMO_LOCATIONS: DemoLocation[] = [
  { id: 'cupertino', name: 'Cupertino', county: 'Santa Clara County', coords: APPLE_PARK },
  { id: 'san-jose', name: 'San Jose', county: 'Santa Clara County', coords: { latitude: 37.3382, longitude: -121.8863 } },
  { id: 'san-francisco', name: 'San Francisco', county: 'SF County', coords: SAN_FRANCISCO },
];
