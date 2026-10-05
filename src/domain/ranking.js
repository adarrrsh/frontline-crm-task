import { affinityFor, categoryAffinity } from './affinity';
import { distanceKm } from './geo';
import { explain, warningsFor } from './reasons';
import {
  AFFINITY_WEIGHT,
  DECAY_WITHOUT_TRANSPORT,
  DECAY_WITH_TRANSPORT,
  DIVERSITY_LOOKAHEAD,
  DIVERSITY_MAX_SCORE_DROP,
  FRESHNESS_DAYS,
  MAX_SAME_CATEGORY_RUN,
  MAX_SAME_EMPLOYER_RUN,
  NON_PREFERRED_CATEGORY,
  PAY_SPREAD,
  START_SCORE,
  WEIGHTS,
} from './weights';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function computeFeatures(job, distance, profile, affinity) {
  const k = profile.maxDistanceKm * (profile.hasTransport ? DECAY_WITH_TRANSPORT : DECAY_WITHOUT_TRANSPORT);
  const proximity = Math.exp(-distance / k);

  const category = profile.categories.length === 0 || profile.categories.includes(job.category) ? 1 : NON_PREFERRED_CATEGORY;

  const pay = clamp(0.5 + (job.payPerHour - profile.minPayPerHour) / (2 * PAY_SPREAD), 0, 1);

  const shiftFit =
    profile.shifts.length === 0 || job.shifts.length === 0
      ? 1
      : job.shifts.filter((s) => profile.shifts.includes(s)).length / job.shifts.length;

  const fresh = Math.max(0, 1 - job.postedDaysAgo / FRESHNESS_DAYS);
  const urgency = 0.6 * START_SCORE[job.startsAt] + 0.4 * fresh;

  return {
    proximity,
    category,
    pay,
    shiftFit,
    urgency,
    affinity: affinityFor(affinity, job.category),
  };
}

/** 0–100. */
export function scoreOf(f) {
  const base =
    WEIGHTS.proximity * f.proximity +
    WEIGHTS.category * f.category +
    WEIGHTS.pay * f.pay +
    WEIGHTS.shiftFit * f.shiftFit +
    WEIGHTS.urgency * f.urgency;
  const learned = AFFINITY_WEIGHT * (2 * f.affinity - 1);
  return Math.round(100 * clamp(base + learned, 0, 1));
}

/** Unswiped jobs within `radiusKm` of `origin` — the only hard filters. */
export function candidates(jobs, origin, radiusKm, swipedIds) {
  const out = [];
  for (const job of jobs) {
    if (swipedIds.has(job.id)) continue;
    const d = distanceKm(origin, job.location);
    if (d <= radiusKm) out.push({ job, distanceKm: d });
  }
  return out;
}

export function countWithinRadius(jobs, origin, radiusKm, swipes) {
  return candidates(jobs, origin, radiusKm, new Set(swipes.map((s) => s.jobId))).length;
}

const byRank = (a, b) => b.score - a.score || a.distanceKm - b.distanceKm || a.job.id.localeCompare(b.job.id);

/** Would placing `next` after `placed` create a run that's too long? */
function breaksVariety(placed, next) {
  const lastCats = placed.slice(-MAX_SAME_CATEGORY_RUN);
  if (lastCats.length === MAX_SAME_CATEGORY_RUN && lastCats.every((r) => r.job.category === next.job.category)) return true;
  const lastEmps = placed.slice(-MAX_SAME_EMPLOYER_RUN);
  return lastEmps.length === MAX_SAME_EMPLOYER_RUN && lastEmps.every((r) => r.job.employerId === next.job.employerId);
}

/** Greedy, bounded: only swaps in a job within DIVERSITY_MAX_SCORE_DROP points of the one it displaces. */
export function diversify(sorted) {
  const pool = [...sorted];
  const out = [];
  while (pool.length > 0) {
    let pick = 0;
    if (breaksVariety(out, pool[0])) {
      for (let i = 1; i <= DIVERSITY_LOOKAHEAD && i < pool.length; i++) {
        if (pool[0].score - pool[i].score > DIVERSITY_MAX_SCORE_DROP) break;
        if (!breaksVariety(out, pool[i])) {
          pick = i;
          break;
        }
      }
    }
    out.push(pool.splice(pick, 1)[0]);
  }
  return out;
}

/** Candidates → features → score → sort → diversify → explain. Pure and deterministic. */
export function rankJobs(jobs, profile, origin, swipes, { diversify: shouldDiversify = true } = {}) {
  const jobsById = new Map(jobs.map((j) => [j.id, j]));
  const affinity = categoryAffinity(swipes, jobsById);
  const swipedIds = new Set(swipes.map((s) => s.jobId));

  const ranked = candidates(jobs, origin, profile.maxDistanceKm, swipedIds)
    .map(({ job, distanceKm: d }) => {
      const features = computeFeatures(job, d, profile, affinity);
      return {
        job,
        distanceKm: d,
        score: scoreOf(features),
        features,
        reasons: explain(job, d, features, profile),
        warnings: warningsFor(job, features, profile),
      };
    })
    .sort(byRank);

  return shouldDiversify ? diversify(ranked) : ranked;
}

/**
 * Keeps the cards the worker can currently see (`pinnedIds`, top of the previous deck) at the
 * front, in their previous order, so a re-rank never reshuffles cards under the finger.
 */
export function stabilizeDeck(ranked, pinnedIds) {
  const byId = new Map(ranked.map((r) => [r.job.id, r]));
  const pinned = pinnedIds.map((id) => byId.get(id)).filter((r) => !!r);
  const pinnedSet = new Set(pinned.map((r) => r.job.id));
  return [...pinned, ...ranked.filter((r) => !pinnedSet.has(r.job.id))];
}
