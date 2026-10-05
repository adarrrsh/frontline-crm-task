import { formatDistance } from './geo';
import { sharedLanguages } from './languages';
import { payInUsd } from './money';
import { AFFINITY_WEIGHT, LANGUAGE_REASON_WEIGHT, WEIGHTS } from './weights';

/** Top-2 "why this job" reasons, ordered by how much each feature contributed to the score. */
export function explain(job, distanceKm, f, profile, max = 2) {
  const candidates = [];
  const payDelta = payInUsd(job) - profile.minPayPerHour;

  if (f.proximity >= 0.6)
    candidates.push({
      kind: 'distance',
      params: { distance: formatDistance(distanceKm) },
      contribution: WEIGHTS.proximity * f.proximity,
    });
  if (payDelta >= 2)
    candidates.push({
      kind: 'pay',
      params: { amount: Math.round(payDelta) },
      contribution: WEIGHTS.pay * f.pay,
    });
  if (f.shiftFit === 1 && profile.shifts.length > 0)
    candidates.push({
      kind: 'shifts',
      params: job.shifts.length === 1 ? { shift: job.shifts[0] } : {},
      contribution: WEIGHTS.shiftFit * f.shiftFit,
    });
  if (job.startsAt === 'immediately')
    candidates.push({
      kind: 'urgency',
      params: {},
      contribution: WEIGHTS.urgency * f.urgency,
    });
  if (f.category === 1 && profile.categories.length > 0)
    candidates.push({
      kind: 'category',
      params: { category: job.category },
      contribution: WEIGHTS.category * f.category,
    });
  if (f.affinity >= 0.65)
    candidates.push({
      kind: 'affinity',
      params: {},
      contribution: AFFINITY_WEIGHT * (2 * f.affinity - 1),
    });
  // English is the default, so only a shared local language is worth calling out.
  const local = sharedLanguages(job, profile).find((l) => l !== 'en');
  if (local)
    candidates.push({
      kind: 'language',
      params: { language: local },
      contribution: LANGUAGE_REASON_WEIGHT,
    });

  return candidates
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, max)
    .map(({ kind, params }) => ({ kind, params }));
}

export function warningsFor(job, f, profile) {
  const out = [];
  if (payInUsd(job) < profile.minPayPerHour) out.push({ kind: 'belowMinPay', params: {} });
  if (profile.shifts.length > 0 && f.shiftFit < 1) out.push({ kind: 'partialShifts', params: { none: f.shiftFit === 0 } });
  if (f.language === 0) out.push({ kind: 'language', params: { languages: job.languages } });
  return out;
}
