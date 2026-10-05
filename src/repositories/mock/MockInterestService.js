import { EMPLOYERS_BY_ID } from '@/data/employers';
import { simulateEmployerInterest } from '@/domain/matching';

export class MockInterestService {
  async submit(job, profile, now) {
    const employer = EMPLOYERS_BY_ID.get(job.employerId);
    if (!employer) throw new Error(`Unknown employer ${job.employerId}`);
    const { outcome, delayMs } = simulateEmployerInterest(job, employer, profile);
    return { outcome, resolveAt: now + delayMs };
  }
}
