import { useMemo } from 'react';

import { DEMO_LOCATIONS, type DemoLocation } from '@/data/demoLocations';
import { distanceKm, formatDistance } from '@/domain/geo';
import { countWithinRadius } from '@/domain/ranking';
import { useAppStore } from '@/store/useAppStore';
import { useCatalogStore } from '@/store/useCatalogStore';

import { useEffectiveLocation } from './useEffectiveLocation';

export interface LocationChoice extends DemoLocation {
  jobCount: number;
  /** Distance from where you're searching now, if known. */
  distance: string | null;
}

/** Preset areas for the manual picker, with live job counts at the worker's radius. */
export function useLocationChoices(): LocationChoice[] {
  const jobs = useCatalogStore((s) => s.jobs);
  const swipes = useAppStore((s) => s.swipes);
  const radius = useAppStore((s) => s.profile.maxDistanceKm);
  const { coords } = useEffectiveLocation();

  return useMemo(
    () =>
      DEMO_LOCATIONS.map((l) => ({
        ...l,
        jobCount: countWithinRadius(jobs, l.coords, radius, swipes),
        distance: coords ? formatDistance(distanceKm(coords, l.coords)) : null,
      })),
    [jobs, swipes, radius, coords],
  );
}
