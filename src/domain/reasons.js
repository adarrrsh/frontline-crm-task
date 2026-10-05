import { formatDistance } from './geo';
import { CATEGORY_LABEL } from './labels';
import { AFFINITY_WEIGHT, WEIGHTS } from './weights';

const SHIFT_PLURAL = {
  morning: 'mornings',
  afternoon: 'afternoons',
  evening: 'evenings',
  night: 'nights',
  weekend: 'weekends',
};

/** Top-2 "why this job" reasons, ordered by how much each feature contributed to the score. */
export function explain(job, distanceKm, f, profile, max = 2) {
  const candidates = [];
  const payDelta = job.payPerHour - profile.minPayPerHour;

  if (f.proximity >= 0.6)
    candidates.push({
      kind: 'distance',
      text: `${formatDistance(distanceKm)} away`,
      contribution: WEIGHTS.proximity * f.proximity,
    });
  if (payDelta >= 2)
    candidates.push({
      kind: 'pay',
      text: `$${Math.round(payDelta)}/hr above your minimum`,
      contribution: WEIGHTS.pay * f.pay,
    });
  if (f.shiftFit === 1 && profile.shifts.length > 0)
    candidates.push({
      kind: 'shifts',
      text: job.shifts.length === 1 ? `Fits your ${SHIFT_PLURAL[job.shifts[0]]}` : 'Fits your availability',
      contribution: WEIGHTS.shiftFit * f.shiftFit,
    });
  if (job.startsAt === 'immediately')
    candidates.push({
      kind: 'urgency',
      text: 'Starts immediately',
      contribution: WEIGHTS.urgency * f.urgency,
    });
  if (f.category === 1 && profile.categories.length > 0)
    candidates.push({
      kind: 'category',
      text: `Matches your ${CATEGORY_LABEL[job.category]} preference`,
      contribution: WEIGHTS.category * f.category,
    });
  if (f.affinity >= 0.65)
    candidates.push({
      kind: 'affinity',
      text: 'Similar to jobs you liked',
      contribution: AFFINITY_WEIGHT * (2 * f.affinity - 1),
    });

  return candidates
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, max)
    .map(({ kind, text }) => ({ kind, text }));
}

export function warningsFor(job, f, profile) {
  const out = [];
  if (job.payPerHour < profile.minPayPerHour) out.push({ kind: 'belowMinPay', text: 'Below your minimum pay' });
  if (profile.shifts.length > 0 && f.shiftFit < 1)
    out.push({
      kind: 'partialShifts',
      text: f.shiftFit === 0 ? 'Outside your availability' : 'Only some shifts fit you',
    });
  return out;
}
