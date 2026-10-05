import { expoLocationAdapter } from './expoLocationAdapter';
import { MockInterestService } from './mock/MockInterestService';
import { MockJobRepository } from './mock/MockJobRepository';

/** Composition root: the active implementations. Tests replace these with fakes. */
export const repositories = {
  jobs: new MockJobRepository(),
  interest: new MockInterestService(),
  location: expoLocationAdapter,
};
