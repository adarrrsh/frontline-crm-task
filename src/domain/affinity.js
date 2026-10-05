/**
 * Beta(1,1)-smoothed like rate per category: (likes + 1) / (likes + passes + 2).
 * A category with no swipes is absent from the map and reads as 0.5.
 */
export function categoryAffinity(swipes, jobsById) {
  const counts = {};
  for (const s of swipes) {
    const job = jobsById.get(s.jobId);
    if (!job) continue;
    const c = (counts[job.category] ??= { likes: 0, passes: 0 });
    if (s.direction === 'like') c.likes++;
    else c.passes++;
  }
  const out = {};
  for (const [cat, { likes, passes }] of Object.entries(counts)) {
    out[cat] = (likes + 1) / (likes + passes + 2);
  }
  return out;
}

export const affinityFor = (map, category) => map[category] ?? 0.5;
