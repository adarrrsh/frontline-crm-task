import { languageFit, sharedLanguages } from '@/domain/languages';
import { interestProbability } from '@/domain/matching';
import { payInUsd } from '@/domain/money';
import { rankJobs } from '@/domain/ranking';

import { makeJob, ORIGIN, profile } from './fixtures';

const employer = { id: 'e', name: 'E', monogram: 'E', baseInterest: 0.5, responseDelayMs: [1500, 4000], contact: '' };

describe('languageFit', () => {
  it('is neutral when the worker or the job lists no languages', () => {
    expect(languageFit(makeJob({ id: 'a', languages: ['de'] }), profile())).toBe(1);
    expect(languageFit(makeJob({ id: 'b', languages: [] }), profile({ languages: ['fr'] }))).toBe(1);
  });

  it('needs only one shared language', () => {
    const job = makeJob({ id: 'c', languages: ['rm', 'de'] });
    expect(languageFit(job, profile({ languages: ['de', 'en'] }))).toBe(1);
    expect(sharedLanguages(job, profile({ languages: ['de', 'en'] }))).toEqual(['de']);
    expect(languageFit(job, profile({ languages: ['it'] }))).toBe(0);
  });
});

describe('language in ranking', () => {
  const german = makeJob({ id: 'de-job', languages: ['de'] });

  it('ranks a job below an identical one the worker can speak, without hiding it', () => {
    const french = makeJob({ id: 'fr-job', languages: ['fr'] });
    const ranked = rankJobs([german, french], profile({ languages: ['fr'] }), ORIGIN, []);
    expect(ranked.map((r) => r.job.id)).toEqual(['fr-job', 'de-job']);
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it('warns with the languages the job needs', () => {
    const [r] = rankJobs([makeJob({ id: 'x', languages: ['de', 'rm'] })], profile({ languages: ['it'] }), ORIGIN, []);
    expect(r.warnings).toContainEqual({ kind: 'language', params: { languages: ['de', 'rm'] } });
  });

  it('gives a reason when the worker speaks a non-English job language', () => {
    const [r] = rankJobs([german], profile({ languages: ['en', 'de'] }), ORIGIN, []);
    expect(r.reasons).toContainEqual({ kind: 'language', params: { language: 'de' } });
  });

  it('leaves scores unchanged when the worker lists no languages', () => {
    const plain = makeJob({ id: 'plain' });
    const [a] = rankJobs([german], profile(), ORIGIN, []);
    const [b] = rankJobs([plain], profile(), ORIGIN, []);
    expect(a.score).toBe(b.score);
  });
});

describe('language in employer interest', () => {
  it('lowers the chance of a match when the worker shares no language', () => {
    const job = makeJob({ id: 'j', languages: ['fr'] });
    expect(interestProbability(job, employer, profile({ languages: ['de'] }))).toBeLessThan(
      interestProbability(job, employer, profile({ languages: ['fr'] })),
    );
  });
});

describe('payInUsd', () => {
  it('converts CHF pay so it can be compared with the USD minimum', () => {
    expect(payInUsd(makeJob({ id: 'u', payPerHour: 20 }))).toBe(20);
    expect(payInUsd(makeJob({ id: 'c', payPerHour: 20, currency: 'CHF' }))).toBe(25);
  });
});
