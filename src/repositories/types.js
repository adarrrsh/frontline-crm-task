/**
 * Seams for a future backend. Screens never touch these directly — they go through stores/hooks.
 *
 * @typedef {object} JobRepository
 * @property {() => Promise<import('@/domain/types').Job[]>} getJobs
 * @property {() => Promise<import('@/domain/types').Employer[]>} getEmployers
 *
 * @typedef {object} InterestService "Send interest to the employer". The mock precomputes the reply; a real API would push it later.
 * @property {(job: import('@/domain/types').Job, profile: import('@/domain/types').WorkerProfile, now: number)
 *   => Promise<{ resolveAt: number, outcome: import('@/domain/types').InterestOutcome }>} submit
 *
 * @typedef {'granted' | 'denied' | 'undetermined'} PermissionStatus
 * @typedef {{ status: PermissionStatus, canAskAgain: boolean }} PermissionState
 *
 * @typedef {object} LocationAdapter
 * @property {() => Promise<PermissionState>} getPermission
 * @property {() => Promise<PermissionState>} requestPermission
 * @property {(timeoutMs: number) => Promise<import('@/domain/types').Coordinates>} getPosition
 *   Last-known position first (fast), then a fresh fix. Throws LocationUnavailableError.
 * @property {() => void} openSettings
 */

export class LocationUnavailableError extends Error {
  /** @param {'timeout' | 'services-off' | 'error'} reason */
  constructor(reason) {
    super(`Location unavailable: ${reason}`);
    this.reason = reason;
  }
}
