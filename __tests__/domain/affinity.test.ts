import { affinityFor, categoryAffinity } from '@/domain/affinity';
import { computeFeatures, scoreOf } from '@/domain/ranking';

import { makeJob, profile, swipe } from './fixtures';

const jobs = [0, 1, 2, 3].map((i) => makeJob({ id: `w${i}`, category: 'warehouse' }));
const byId = new Map(jobs.map((j) => [j.id, j]));

describe('categoryAffinity', () => {
  it('reads 0.5 for a category with no swipes', () => {
    expect(affinityFor(categoryAffinity([], byId), 'warehouse')).toBe(0.5);
  });

  it('uses Beta(1,1) smoothing', () => {
    const likes3 = categoryAffinity(['w0', 'w1', 'w2'].map((id) => swipe(id, 'like')), byId);
    expect(affinityFor(likes3, 'warehouse')).toBeCloseTo(0.8);
    const passes4 = categoryAffinity(['w0', 'w1', 'w2', 'w3'].map((id) => swipe(id, 'pass')), byId);
    expect(affinityFor(passes4, 'warehouse')).toBeCloseTo(1 / 6);
  });

  it('ignores swipes on unknown jobs', () => {
    expect(categoryAffinity([swipe('missing', 'like')], byId)).toEqual({});
  });

  it('caps the learned adjustment at ±15 points', () => {
    const job = makeJob({ id: 'x' });
    const f = computeFeatures(job, 1, profile(), {});
    const neutral = scoreOf({ ...f, affinity: 0.5 });
    expect(scoreOf({ ...f, affinity: 1 }) - neutral).toBeLessThanOrEqual(15);
    expect(neutral - scoreOf({ ...f, affinity: 0 })).toBeLessThanOrEqual(15);
  });
});
