import { distanceKm, formatDistance } from '@/domain/geo';

describe('distanceKm', () => {
  it('is zero for the same point', () => {
    const p = { latitude: 37.33, longitude: -122.0 };
    expect(distanceKm(p, p)).toBe(0);
  });

  it('matches known city-pair distances within 1%', () => {
    const sf = { latitude: 37.7749, longitude: -122.4194 };
    const la = { latitude: 34.0522, longitude: -118.2437 };
    const london = { latitude: 51.5074, longitude: -0.1278 };
    const paris = { latitude: 48.8566, longitude: 2.3522 };
    expect(distanceKm(sf, la)).toBeCloseTo(559, -1);
    expect(Math.abs(distanceKm(london, paris) - 343.5) / 343.5).toBeLessThan(0.01);
  });

  it('is symmetric', () => {
    const a = { latitude: 37.3349, longitude: -122.009 };
    const b = { latitude: 37.3382, longitude: -121.8863 };
    expect(distanceKm(a, b)).toBeCloseTo(distanceKm(b, a), 10);
  });
});

describe('formatDistance', () => {
  it('uses one decimal under 10 km and whole km above', () => {
    expect(formatDistance(1.46)).toBe('1.5 km');
    expect(formatDistance(4)).toBe('4 km');
    expect(formatDistance(12.4)).toBe('12 km');
  });
});
