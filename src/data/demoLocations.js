/** The iOS Simulator's default location (Features → Location → Apple). */
export const APPLE_PARK = { latitude: 37.3349, longitude: -122.009 };
export const SAN_FRANCISCO = { latitude: 37.7749, longitude: -122.4194 };

/** One city per Swiss language region. */
export const ZURICH = { latitude: 47.3779, longitude: 8.5403 };
export const GENEVA = { latitude: 46.2044, longitude: 6.1432 };
export const LUGANO = { latitude: 46.0037, longitude: 8.9511 };
export const CHUR = { latitude: 46.8508, longitude: 9.532 };

export const DEMO_LOCATIONS = [
  {
    id: 'cupertino',
    name: 'Cupertino',
    county: 'Santa Clara County',
    coords: APPLE_PARK,
  },
  {
    id: 'san-jose',
    name: 'San Jose',
    county: 'Santa Clara County',
    coords: { latitude: 37.3382, longitude: -121.8863 },
  },
  {
    id: 'san-francisco',
    name: 'San Francisco',
    county: 'SF County',
    coords: SAN_FRANCISCO,
  },
  { id: 'zurich', name: 'Zürich', county: 'Kanton Zürich · Deutsch', coords: ZURICH },
  { id: 'geneva', name: 'Genève', county: 'Canton de Genève · Français', coords: GENEVA },
  { id: 'lugano', name: 'Lugano', county: 'Cantone Ticino · Italiano', coords: LUGANO },
  { id: 'chur', name: 'Chur', county: 'Chantun Grischun · Rumantsch', coords: CHUR },
];
