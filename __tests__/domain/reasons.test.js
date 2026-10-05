import { rankJobs } from '@/domain/ranking';

import { makeJob, north, ORIGIN, profile, WORKED } from './fixtures';

describe('reasons', () => {
  it('returns at most 2 reasons, strongest contribution first', () => {
    const [barista] = rankJobs([WORKED.barista], profile(), ORIGIN, []);
    expect(barista.reasons).toHaveLength(2);
    expect(barista.reasons[0]).toEqual({
      kind: 'distance',
      params: { distance: '1.5 km' },
    });
  });

  it('mentions pay when it is at least $2 above the minimum', () => {
    const job = makeJob({
      id: 'p',
      payPerHour: 24,
      location: north(9),
      category: 'warehouse',
      shifts: ['night'],
    });
    const [r] = rankJobs([job], profile(), ORIGIN, []);
    expect(r.reasons).toContainEqual({ kind: 'pay', params: { amount: 6 } });
  });

  it('reports warnings independently of reasons', () => {
    const job = makeJob({
      id: 'w',
      payPerHour: 15,
      shifts: ['morning', 'night'],
    });
    const [r] = rankJobs([job], profile(), ORIGIN, []);
    expect(r.warnings).toEqual([
      { kind: 'belowMinPay', params: {} },
      { kind: 'partialShifts', params: { none: false } },
    ]);
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it('has no shift warning when the worker set no availability', () => {
    const [r] = rankJobs([makeJob({ id: 'n', shifts: ['night'] })], profile({ shifts: [] }), ORIGIN, []);
    expect(r.warnings).toEqual([]);
  });
});
