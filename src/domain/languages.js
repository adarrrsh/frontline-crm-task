/** Job languages the worker also speaks. */
export function sharedLanguages(job, profile) {
  const spoken = profile.languages ?? [];
  return (job.languages ?? []).filter((l) => spoken.includes(l));
}

/**
 * 1 when the worker speaks at least one language the job can be done in, else 0.
 * A worker who hasn't listed languages, or a job with none listed, is never penalised.
 */
export function languageFit(job, profile) {
  if (!profile.languages?.length || !job.languages?.length) return 1;
  return sharedLanguages(job, profile).length > 0 ? 1 : 0;
}
