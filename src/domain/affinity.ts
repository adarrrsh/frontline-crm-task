import type { Category, Job, Swipe } from './types';

export type AffinityMap = Partial<Record<Category, number>>;

/**
 * Beta(1,1)-smoothed like rate per category: (likes + 1) / (likes + passes + 2).
 * A category with no swipes is absent from the map and reads as 0.5.
 */
export function categoryAffinity(swipes: Swipe[], jobsById: Map<string, Job>): AffinityMap {
  const counts: Partial<Record<Category, { likes: number; passes: number }>> = {};
  for (const s of swipes) {
    const job = jobsById.get(s.jobId);
    if (!job) continue;
    const c = (counts[job.category] ??= { likes: 0, passes: 0 });
    if (s.direction === 'like') c.likes++;
    else c.passes++;
  }
  const out: AffinityMap = {};
  for (const [cat, { likes, passes }] of Object.entries(counts) as [Category, { likes: number; passes: number }][]) {
    out[cat] = (likes + 1) / (likes + passes + 2);
  }
  return out;
}

export const affinityFor = (map: AffinityMap, category: Category) => map[category] ?? 0.5;
