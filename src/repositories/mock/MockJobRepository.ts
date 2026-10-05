import { EMPLOYERS } from '@/data/employers';
import { JOBS } from '@/data/jobs';

import type { JobRepository } from '../types';

const latency = (min = 200, max = 400) =>
  new Promise<void>((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));

export class MockJobRepository implements JobRepository {
  async getJobs() {
    await latency();
    return JOBS;
  }

  async getEmployers() {
    await latency();
    return EMPLOYERS;
  }
}
