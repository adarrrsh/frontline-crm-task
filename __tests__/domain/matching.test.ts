import { dueInterests, nextResolveAt } from '@/domain/interest';
import { hash01, interestProbability, simulateEmployerInterest } from '@/domain/matching';
import type { Employer, LikedJob } from '@/domain/types';

import { makeJob, profile } from './fixtures';

const employer = (baseInterest: number): Employer => ({
  id: 'e', name: 'E', monogram: 'E', baseInterest, responseDelayMs: [1500, 4000], contact: '',
});

describe('simulateEmployerInterest', () => {
  it('is deterministic for the same job and profile name', () => {
    const job = makeJob({ id: 'j1' });
    const a = simulateEmployerInterest(job, employer(0.5), profile({ name: 'Jordan' }));
    const b = simulateEmployerInterest(job, employer(0.5), profile({ name: ' jordan ' }));
    expect(a).toEqual(b);
  });

  it('keeps the delay inside the employer range', () => {
    for (let i = 0; i < 50; i++) {
      const { delayMs } = simulateEmployerInterest(makeJob({ id: `j${i}` }), employer(0.5), profile());
      expect(delayMs).toBeGreaterThanOrEqual(1500);
      expect(delayMs).toBeLessThanOrEqual(4000);
    }
  });

  it('hash01 stays in [0, 1)', () => {
    for (const s of ['', 'a', 'Jordan|barista', 'x'.repeat(500)]) {
      expect(hash01(s)).toBeGreaterThanOrEqual(0);
      expect(hash01(s)).toBeLessThan(1);
    }
  });
});

describe('interestProbability', () => {
  it('clamps to 0.05–0.95', () => {
    const job = makeJob({ id: 'j', shifts: ['morning'] });
    expect(interestProbability(job, employer(2), profile({ experienceYears: 3 }))).toBe(0.95);
    expect(interestProbability(job, employer(-1), profile())).toBe(0.05);
  });

  it('penalises delivery jobs without own transport', () => {
    const job = makeJob({ id: 'd', category: 'delivery', shifts: ['night'] });
    const withT = interestProbability(job, employer(0.5), profile({ hasTransport: true }));
    const without = interestProbability(job, employer(0.5), profile({ hasTransport: false }));
    expect(withT - without).toBeCloseTo(0.4);
  });
});

describe('interest timers', () => {
  const like = (jobId: string, status: LikedJob['status'], resolveAt: number): LikedJob => ({
    jobId, status, resolveAt, likedAt: 0, outcome: 'matched',
  });
  const liked = {
    a: like('a', 'pending', 100),
    b: like('b', 'pending', 300),
    c: like('c', 'matched', 50),
  };

  it('dueInterests returns only pending likes that are due', () => {
    expect(dueInterests(liked, 200).map((l) => l.jobId)).toEqual(['a']);
    expect(dueInterests(liked, 300).map((l) => l.jobId)).toEqual(['a', 'b']);
  });

  it('nextResolveAt picks the earliest pending like', () => {
    expect(nextResolveAt(liked)).toBe(100);
    expect(nextResolveAt({ c: liked.c })).toBeNull();
  });
});
