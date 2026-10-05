import type { WorkerProfile } from '@/domain/types';

/** Used by "Try with a demo profile" on the welcome screen. */
export const DEMO_PROFILE: WorkerProfile = {
  name: 'Jordan',
  categories: ['hospitality', 'retail', 'delivery'],
  shifts: ['morning', 'evening', 'weekend'],
  minPayPerHour: 18,
  maxDistanceKm: 10,
  experienceYears: 2,
  hasTransport: true,
};

export const EMPTY_PROFILE: WorkerProfile = {
  name: '',
  categories: [],
  shifts: [],
  minPayPerHour: 18,
  maxDistanceKm: 10,
  experienceYears: 0,
  hasTransport: false,
};
