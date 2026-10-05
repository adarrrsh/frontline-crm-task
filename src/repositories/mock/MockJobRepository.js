import { EMPLOYERS } from '@/data/employers';
import { JOBS } from '@/data/jobs';

const latency = (min = 200, max = 400) => new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));

export class MockJobRepository {
  async getJobs() {
    await latency();
    return JOBS;
  }

  async getEmployers() {
    await latency();
    return EMPLOYERS;
  }
}
