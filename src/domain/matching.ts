import type { Employer, InterestOutcome, Job, WorkerProfile } from './types';

/** FNV-1a → [0, 1). Deterministic, so the same profile always gets the same employer replies. */
export function hash01(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0x100000000;
}

export function interestProbability(job: Job, employer: Employer, profile: WorkerProfile): number {
  let p = employer.baseInterest;
  if (job.shifts.length > 0 && job.shifts.every((s) => profile.shifts.includes(s))) p += 0.15;
  if (profile.experienceYears >= 1) p += 0.1;
  if (job.category === 'delivery') p += profile.hasTransport ? 0.1 : -0.3;
  return Math.min(0.95, Math.max(0.05, p));
}

export interface InterestResult {
  outcome: InterestOutcome;
  delayMs: number;
}

export function simulateEmployerInterest(job: Job, employer: Employer, profile: WorkerProfile): InterestResult {
  const name = profile.name.trim().toLowerCase();
  const roll = hash01(`${job.id}|${name}`);
  const [min, max] = employer.responseDelayMs;
  const delayMs = Math.round(min + hash01(`${job.id}|${name}|delay`) * (max - min));
  return { outcome: roll < interestProbability(job, employer, profile) ? 'matched' : 'declined', delayMs };
}
