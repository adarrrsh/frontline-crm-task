export const CATEGORY_LABEL = {
  hospitality: 'Hospitality',
  retail: 'Retail',
  delivery: 'Delivery',
  cleaning: 'Cleaning',
  warehouse: 'Warehouse',
};

export const SHIFT_LABEL = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
  weekend: 'Weekend',
};

export const EMPLOYMENT_LABEL = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  casual: 'Casual',
  flexible: 'Flexible',
};

export const START_LABEL = {
  immediately: 'Starts immediately',
  'this week': 'Starts this week',
  'next week': 'Starts next week',
};

export const START_SHORT = {
  immediately: 'Now',
  'this week': 'This week',
  'next week': 'Next week',
};

export const CATEGORY_ICON = {
  hospitality: 'coffee',
  retail: 'bag',
  delivery: 'bike',
  cleaning: 'sparkles',
  warehouse: 'package',
};

export const REASON_ICON = {
  distance: 'pin',
  pay: 'cash',
  shifts: 'clock',
  urgency: 'zap',
  category: 'check',
  affinity: 'trend',
};

export const hoursLabel = ({ hoursPerWeek: { min, max } }) => (min === max ? `${min} h/wk` : `${min}–${max} h/wk`);

export const payLabel = (job) => `$${job.payPerHour}/hr${job.tips ? ' + tips' : ''}`;

export const experienceLabel = (years) => (years >= 3 ? '3+ years' : years === 1 ? '1 year' : `${years} years`);

/** "2 min ago", "3 h ago", "yesterday", "4 days ago" */
export function timeAgo(then, now) {
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}
