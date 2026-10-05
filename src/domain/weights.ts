/** Ranking weights and tuning constants. Documented in README → "How jobs are ranked". */
export const WEIGHTS = {
  proximity: 0.35,
  category: 0.2,
  pay: 0.2,
  shiftFit: 0.15,
  urgency: 0.1,
} as const;

/** Max ± contribution of learned category affinity. */
export const AFFINITY_WEIGHT = 0.15;

/** Proximity decay constant as a fraction of the worker's radius. */
export const DECAY_WITH_TRANSPORT = 0.5;
export const DECAY_WITHOUT_TRANSPORT = 0.3;

/** Score given to categories the worker did not pick (preferred = 1). */
export const NON_PREFERRED_CATEGORY = 0.3;

/** $ above/below the minimum that saturates the pay feature. */
export const PAY_SPREAD = 5;

export const START_SCORE = { immediately: 1, 'this week': 0.6, 'next week': 0.2 } as const;
export const FRESHNESS_DAYS = 14;

/** Diversity rerank. */
export const MAX_SAME_CATEGORY_RUN = 2;
export const MAX_SAME_EMPLOYER_RUN = 1;
export const DIVERSITY_LOOKAHEAD = 3;
export const DIVERSITY_MAX_SCORE_DROP = 10;
