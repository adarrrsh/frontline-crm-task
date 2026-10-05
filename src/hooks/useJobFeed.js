import { useCallback, useMemo } from 'react';

import { candidates, countWithinRadius, rankJobs, stabilizeDeck } from '@/domain/ranking';
import { useAppStore } from '@/store/useAppStore';
import { useCatalogStore } from '@/store/useCatalogStore';
import { useDeckStore } from '@/store/useDeckStore';

import { useEffectiveLocation } from './useEffectiveLocation';

/** Catalog + profile + swipes + origin → ranked deck, with the visible cards pinned. */
export function useJobFeed() {
  const catalogStatus = useCatalogStore((s) => s.status);
  const jobs = useCatalogStore((s) => s.jobs);
  const profile = useAppStore((s) => s.profile);
  const swipes = useAppStore((s) => s.swipes);
  const pins = useDeckStore((s) => s.pins);
  const { coords } = useEffectiveLocation();

  const deck = useMemo(() => {
    if (!coords || jobs.length === 0) return [];
    return stabilizeDeck(rankJobs(jobs, profile, coords, swipes), pins);
  }, [coords, jobs, profile, swipes, pins]);

  const countWithin = useCallback(
    (radiusKm) => (coords ? countWithinRadius(jobs, coords, radiusKm, swipes) : 0),
    [coords, jobs, swipes],
  );

  const seenWithin = useCallback(
    (radiusKm) => {
      if (!coords) return { total: 0, liked: 0 };
      const inRadius = new Set(candidates(jobs, coords, radiusKm, new Set()).map((c) => c.job.id));
      const seen = swipes.filter((s) => inRadius.has(s.jobId));
      return {
        total: seen.length,
        liked: seen.filter((s) => s.direction === 'like').length,
      };
    },
    [coords, jobs, swipes],
  );

  const status =
    catalogStatus === 'error' ? 'error' : catalogStatus !== 'ready' ? 'loading' : !coords ? 'needs-location' : 'ready';

  return { status, deck, countWithin, seenWithin };
}
