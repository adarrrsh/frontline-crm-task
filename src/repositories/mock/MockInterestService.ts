import { EMPLOYERS_BY_ID } from '@/data/employers';
import { simulateEmployerInterest } from '@/domain/matching';
import type { Job, WorkerProfile } from '@/domain/types';

import type { InterestService } from '../types';

export class MockInterestService implements InterestService {
  async submit(job: Job, profile: WorkerProfile, now: number) {
    const employer = EMPLOYERS_BY_ID.get(job.employerId);
    if (!employer) throw new Error(`Unknown employer ${job.employerId}`);
    const { outcome, delayMs } = simulateEmployerInterest(job, employer, profile);
    return { outcome, resolveAt: now + delayMs };
  }
}
