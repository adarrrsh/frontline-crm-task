import { useMemo } from 'react';

import { categoryAffinity } from '@/domain/affinity';
import { distanceKm } from '@/domain/geo';
import { computeFeatures } from '@/domain/ranking';
import { explain, warningsFor } from '@/domain/reasons';
import { useAppStore } from '@/store/useAppStore';
import { useCatalogStore } from '@/store/useCatalogStore';

import { useEffectiveLocation } from './useEffectiveLocation';

/** Liked jobs joined with the catalog, newest first. */
export function useLikedJobs() {
  const likedJobs = useAppStore((s) => s.likedJobs);
  const jobsById = useCatalogStore((s) => s.jobsById);
  const employersById = useCatalogStore((s) => s.employersById);
  const { coords } = useEffectiveLocation();

  return useMemo(
    () =>
      Object.values(likedJobs)
        .map((liked) => {
          const job = jobsById.get(liked.jobId);
          if (!job) return null;
          return {
            job,
            liked,
            employer: employersById.get(job.employerId),
            distanceKm: coords ? distanceKm(coords, job.location) : null,
          };
        })
        .filter((r) => r !== null)
        .sort((a, b) => b.liked.likedAt - a.liked.likedAt),
    [likedJobs, jobsById, employersById, coords],
  );
}

/** Everything the detail screen shows, with "why this job" recomputed for the current profile and origin. */
export function useJobDetails(id) {
  const jobsById = useCatalogStore((s) => s.jobsById);
  const jobs = useCatalogStore((s) => s.jobs);
  const employersById = useCatalogStore((s) => s.employersById);
  const liked = useAppStore((s) => (id ? s.likedJobs[id] : undefined));
  const swipes = useAppStore((s) => s.swipes);
  const profile = useAppStore((s) => s.profile);
  const { coords } = useEffectiveLocation();

  return useMemo(() => {
    const job = id ? jobsById.get(id) : undefined;
    if (!job) return null;
    const d = coords ? distanceKm(coords, job.location) : null;
    // Affinity excluding this job's own like, so it doesn't explain itself.
    const affinity = categoryAffinity(
      swipes.filter((s) => s.jobId !== job.id),
      new Map(jobs.map((j) => [j.id, j])),
    );
    const features = computeFeatures(job, d ?? profile.maxDistanceKm, profile, affinity);
    return {
      job,
      employer: employersById.get(job.employerId),
      liked,
      distanceKm: d,
      reasons: d === null ? explain(job, 0, { ...features, proximity: 0 }, profile) : explain(job, d, features, profile),
      warnings: warningsFor(job, features, profile),
    };
  }, [id, jobsById, jobs, employersById, liked, swipes, profile, coords]);
}
