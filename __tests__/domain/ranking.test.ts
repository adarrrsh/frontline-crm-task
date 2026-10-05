import { computeFeatures, countWithinRadius, diversify, rankJobs, stabilizeDeck } from '@/domain/ranking';
import type { RankedJob } from '@/domain/types';

import { makeJob, north, ORIGIN, profile, swipe, WORKED } from './fixtures';

const ids = (r: RankedJob[]) => r.map((x) => x.job.id);

describe('rankJobs — worked example (plan.md §5.2)', () => {
  const jobs = Object.values(WORKED);

  it('reproduces 84 / 53 / 49 in that order', () => {
    const ranked = rankJobs(jobs, profile(), ORIGIN, [], { diversify: false });
    expect(ranked.map((r) => [r.job.id, r.score])).toEqual([
      ['barista', 84],
      ['retail', 53],
      ['picker', 49],
    ]);
  });

  it('learns: 3 warehouse likes lift the picker to 58, above the retail job', () => {
    const extra = [1, 2, 3].map((i) => makeJob({ id: `w${i}`, category: 'warehouse', location: north(50) }));
    const ranked = rankJobs([...jobs, ...extra], profile(), ORIGIN, extra.map((j) => swipe(j.id, 'like')), {
      diversify: false,
    });
    expect(ranked.map((r) => [r.job.id, r.score])).toEqual([
      ['barista', 84],
      ['picker', 58],
      ['retail', 53],
    ]);
  });
});

describe('rankJobs — filters', () => {
  it('hides jobs outside the radius (the only distance hard filter)', () => {
    const near = makeJob({ id: 'near', location: north(3) });
    const far = makeJob({ id: 'far', location: north(12) });
    expect(ids(rankJobs([near, far], profile({ maxDistanceKm: 10 }), ORIGIN, []))).toEqual(['near']);
    expect(ids(rankJobs([near, far], profile({ maxDistanceKm: 15 }), ORIGIN, []))).toEqual(['near', 'far']);
  });

  it('excludes already-swiped jobs, liked or passed', () => {
    const a = makeJob({ id: 'a' });
    const b = makeJob({ id: 'b' });
    const c = makeJob({ id: 'c' });
    expect(ids(rankJobs([a, b, c], profile(), ORIGIN, [swipe('a', 'like'), swipe('b', 'pass')]))).toEqual(['c']);
  });

  it('keeps non-preferred categories, ranked lower', () => {
    const pref = makeJob({ id: 'pref', category: 'retail' });
    const other = makeJob({ id: 'other', category: 'cleaning' });
    const ranked = rankJobs([other, pref], profile({ categories: ['retail'] }), ORIGIN, []);
    expect(ids(ranked)).toEqual(['pref', 'other']);
  });

  it('keeps below-minimum-pay jobs, ranked lower and flagged', () => {
    const ok = makeJob({ id: 'ok', payPerHour: 20 });
    const low = makeJob({ id: 'low', payPerHour: 15 });
    const ranked = rankJobs([low, ok], profile({ minPayPerHour: 18 }), ORIGIN, []);
    expect(ids(ranked)).toEqual(['ok', 'low']);
    expect(ranked[1].warnings.map((w) => w.kind)).toContain('belowMinPay');
  });
});

describe('rankJobs — distance', () => {
  it('ranks closer jobs higher when everything else is equal', () => {
    const jobs = [5, 1, 3].map((km) => makeJob({ id: `d${km}`, location: north(km) }));
    expect(ids(rankJobs(jobs, profile(), ORIGIN, []))).toEqual(['d1', 'd3', 'd5']);
  });

  it('decays faster without own transport', () => {
    const job = makeJob({ id: 'x' });
    const withCar = computeFeatures(job, 5, profile({ hasTransport: true }), {});
    const without = computeFeatures(job, 5, profile({ hasTransport: false }), {});
    expect(withCar.proximity).toBeCloseTo(Math.exp(-1));
    expect(without.proximity).toBeLessThan(withCar.proximity);
  });

  it('is deterministic, breaking ties by distance then id', () => {
    const jobs = ['b', 'a', 'c'].map((id) => makeJob({ id, location: north(2) }));
    const first = ids(rankJobs(jobs, profile(), ORIGIN, []));
    expect(first).toEqual(['a', 'b', 'c']);
    expect(ids(rankJobs([...jobs].reverse(), profile(), ORIGIN, []))).toEqual(first);
  });
});

describe('diversify', () => {
  const ranked = (specs: [string, string, number, string?][]): RankedJob[] =>
    specs.map(([id, category, score, employerId]) => ({
      job: makeJob({ id, category: category as never, employerId: employerId ?? `emp-${id}` }),
      distanceKm: 1,
      score,
      features: { proximity: 1, category: 1, pay: 1, shiftFit: 1, urgency: 1, affinity: 0.5 },
      reasons: [],
      warnings: [],
    }));

  it('breaks a run of 3 same-category jobs when an alternative is within 10 points', () => {
    const out = diversify(ranked([['r1', 'retail', 90], ['r2', 'retail', 88], ['r3', 'retail', 86], ['c1', 'cleaning', 84]]));
    expect(ids(out)).toEqual(['r1', 'r2', 'c1', 'r3']);
  });

  it('never promotes a job more than 10 points lower', () => {
    const out = diversify(ranked([['r1', 'retail', 90], ['r2', 'retail', 88], ['r3', 'retail', 86], ['c1', 'cleaning', 70]]));
    expect(ids(out)).toEqual(['r1', 'r2', 'r3', 'c1']);
  });

  it('avoids the same employer twice in a row', () => {
    const out = diversify(ranked([['a', 'retail', 90, 'E'], ['b', 'cleaning', 89, 'E'], ['c', 'delivery', 85, 'F']]));
    expect(ids(out)).toEqual(['a', 'c', 'b']);
  });
});

describe('stabilizeDeck', () => {
  it('keeps the visible cards on top in their previous order', () => {
    const jobs = ['a', 'b', 'c', 'd'].map((id, i) => makeJob({ id, location: north(i + 1) }));
    const ranked = rankJobs(jobs, profile(), ORIGIN, []);
    expect(ids(stabilizeDeck(ranked, ['c', 'a']))).toEqual(['c', 'a', 'b', 'd']);
  });

  it('drops pinned ids that are no longer candidates', () => {
    const ranked = rankJobs([makeJob({ id: 'a' })], profile(), ORIGIN, []);
    expect(ids(stabilizeDeck(ranked, ['gone', 'a']))).toEqual(['a']);
  });
});

describe('countWithinRadius', () => {
  it('counts unswiped jobs inside the radius', () => {
    const jobs = [2, 6, 12].map((km) => makeJob({ id: `k${km}`, location: north(km) }));
    expect(countWithinRadius(jobs, ORIGIN, 10, [])).toBe(2);
    expect(countWithinRadius(jobs, ORIGIN, 15, [swipe('k2', 'pass')])).toBe(2);
  });
});
