import { useCallback, useMemo } from 'react';

import { candidates, countWithinRadius, rankJobs, stabilizeDeck } from '@/domain/ranking';
import type { RankedJob } from '@/domain/types';
import { useAppStore } from '@/store/useAppStore';
import { useCatalogStore } from '@/store/useCatalogStore';
import { useDeckStore } from '@/store/useDeckStore';

import { useEffectiveLocation } from './useEffectiveLocation';

export type FeedStatus = 'loading' | 'error' | 'needs-location' | 'ready';

export interface JobFeed {
  status: FeedStatus;
  deck: RankedJob[];
  /** Unswiped jobs within any radius of the current origin — powers the radius sheet and empty states. */
  countWithin: (radiusKm: number) => number;
  /** Jobs inside the radius the worker has already swiped (for "you've seen everything"). */
  seenWithin: (radiusKm: number) => { total: number; liked: number };
}

/** Catalog + profile + swipes + origin → ranked deck, with the visible cards pinned. */
export function useJobFeed(): JobFeed {
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
    (radiusKm: number) => (coords ? countWithinRadius(jobs, coords, radiusKm, swipes) : 0),
    [coords, jobs, swipes],
  );

  const seenWithin = useCallback(
    (radiusKm: number) => {
      if (!coords) return { total: 0, liked: 0 };
      const inRadius = new Set(candidates(jobs, coords, radiusKm, new Set()).map((c) => c.job.id));
      const seen = swipes.filter((s) => inRadius.has(s.jobId));
      return { total: seen.length, liked: seen.filter((s) => s.direction === 'like').length };
    },
    [coords, jobs, swipes],
  );

  const status: FeedStatus =
    catalogStatus === 'error' ? 'error' : catalogStatus !== 'ready' ? 'loading' : !coords ? 'needs-location' : 'ready';

  return { status, deck, countWithin, seenWithin };
}
