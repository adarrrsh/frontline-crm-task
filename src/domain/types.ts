export const CATEGORIES = ['hospitality', 'retail', 'delivery', 'cleaning', 'warehouse'] as const;
export type Category = (typeof CATEGORIES)[number];

export const SHIFTS = ['morning', 'afternoon', 'evening', 'night', 'weekend'] as const;
export type Shift = (typeof SHIFTS)[number];

export type EmploymentType = 'full-time' | 'part-time' | 'casual' | 'flexible';
export type StartsAt = 'immediately' | 'this week' | 'next week';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Employer {
  id: string;
  name: string;
  monogram: string;
  /** 0–1: how likely this employer is to say yes before profile fit is considered. */
  baseInterest: number;
  /** Min/max ms before the employer "responds" to a like. */
  responseDelayMs: [number, number];
  contact: string;
}

export interface ScheduleSlot {
  days: string;
  time: string;
  shift: Shift;
}

export interface Job {
  id: string;
  employerId: string;
  title: string;
  category: Category;
  payPerHour: number;
  tips?: boolean;
  shifts: Shift[];
  schedule: ScheduleSlot[];
  hoursPerWeek: { min: number; max: number };
  employmentType: EmploymentType;
  location: Coordinates;
  area: string;
  requirements: string[];
  startsAt: StartsAt;
  postedDaysAgo: number;
  description: string;
}

export interface WorkerProfile {
  name: string;
  categories: Category[];
  shifts: Shift[];
  minPayPerHour: number;
  maxDistanceKm: number;
  experienceYears: number;
  hasTransport: boolean;
}

export type SwipeDirection = 'like' | 'pass';

export interface Swipe {
  jobId: string;
  direction: SwipeDirection;
  at: number;
}

export type InterestOutcome = 'matched' | 'declined';
export type InterestStatus = 'pending' | InterestOutcome;

export interface LikedJob {
  jobId: string;
  status: InterestStatus;
  likedAt: number;
  /** When the employer "responds". */
  resolveAt: number;
  /** Precomputed by the interest service, revealed at resolveAt. */
  outcome: InterestOutcome;
  resolvedAt?: number;
}

export interface Features {
  proximity: number;
  category: number;
  pay: number;
  shiftFit: number;
  urgency: number;
  affinity: number;
}

export type ReasonKind = 'distance' | 'pay' | 'shifts' | 'urgency' | 'category' | 'affinity';
export interface Reason {
  kind: ReasonKind;
  text: string;
}
export type WarningKind = 'belowMinPay' | 'partialShifts';
export interface Warning {
  kind: WarningKind;
  text: string;
}

export interface RankedJob {
  job: Job;
  distanceKm: number;
  /** 0–100 */
  score: number;
  features: Features;
  reasons: Reason[];
  warnings: Warning[];
}
