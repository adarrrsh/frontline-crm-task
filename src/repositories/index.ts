import { expoLocationAdapter } from './expoLocationAdapter';
import { MockInterestService } from './mock/MockInterestService';
import { MockJobRepository } from './mock/MockJobRepository';
import type { InterestService, JobRepository, LocationAdapter } from './types';

/** Composition root: the active implementations. Tests replace these with fakes. */
export const repositories: {
  jobs: JobRepository;
  interest: InterestService;
  location: LocationAdapter;
} = {
  jobs: new MockJobRepository(),
  interest: new MockInterestService(),
  location: expoLocationAdapter,
};
