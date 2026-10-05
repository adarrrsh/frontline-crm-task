import type { Coordinates, Job, Swipe, WorkerProfile } from '@/domain/types';

export const ORIGIN: Coordinates = { latitude: 37.3349, longitude: -122.009 };

/** A point `km` due north of ORIGIN. */
export const north = (km: number): Coordinates => ({
  latitude: ORIGIN.latitude + km / 111.195,
  longitude: ORIGIN.longitude,
});

export const profile = (over: Partial<WorkerProfile> = {}): WorkerProfile => ({
  name: 'Test',
  categories: ['retail', 'hospitality'],
  shifts: ['morning', 'afternoon', 'weekend'],
  minPayPerHour: 18,
  maxDistanceKm: 10,
  experienceYears: 0,
  hasTransport: true,
  ...over,
});

export const makeJob = (over: Partial<Job> & { id: string }): Job => ({
  employerId: `emp-${over.id}`,
  title: 'Job',
  category: 'retail',
  payPerHour: 18,
  shifts: ['morning'],
  schedule: [],
  hoursPerWeek: { min: 20, max: 20 },
  employmentType: 'part-time',
  location: north(1),
  area: 'Test',
  requirements: [],
  startsAt: 'this week',
  postedDaysAgo: 0,
  description: '',
  ...over,
});

export const swipe = (jobId: string, direction: Swipe['direction'], at = 0): Swipe => ({ jobId, direction, at });

/** The three jobs from plan.md §5.2 "Worked example". */
export const WORKED = {
  barista: makeJob({
    id: 'barista', category: 'hospitality', payPerHour: 20, shifts: ['morning', 'weekend'],
    startsAt: 'immediately', postedDaysAgo: 2, location: north(1.5),
  }),
  retail: makeJob({
    id: 'retail', category: 'retail', payPerHour: 17, shifts: ['afternoon'],
    startsAt: 'next week', postedDaysAgo: 7, location: north(8),
  }),
  picker: makeJob({
    id: 'picker', category: 'warehouse', payPerHour: 24, shifts: ['night'],
    startsAt: 'this week', postedDaysAgo: 1, location: north(4),
  }),
};
