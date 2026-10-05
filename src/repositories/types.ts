import type { Coordinates, Employer, InterestOutcome, Job, WorkerProfile } from '@/domain/types';

/** Seams for a future backend. Screens never touch these directly — they go through stores/hooks. */
export interface JobRepository {
  getJobs(): Promise<Job[]>;
  getEmployers(): Promise<Employer[]>;
}

export interface InterestService {
  /** "Send interest to the employer". The mock precomputes the reply; a real API would push it later. */
  submit(job: Job, profile: WorkerProfile, now: number): Promise<{ resolveAt: number; outcome: InterestOutcome }>;
}

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';
export interface PermissionState {
  status: PermissionStatus;
  canAskAgain: boolean;
}

export class LocationUnavailableError extends Error {
  constructor(public readonly reason: 'timeout' | 'services-off' | 'error') {
    super(`Location unavailable: ${reason}`);
  }
}

export interface LocationAdapter {
  getPermission(): Promise<PermissionState>;
  requestPermission(): Promise<PermissionState>;
  /** Last-known position first (fast), then a fresh fix. Throws LocationUnavailableError. */
  getPosition(timeoutMs: number): Promise<Coordinates>;
  openSettings(): void;
}
