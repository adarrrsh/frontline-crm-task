export const CATEGORIES = ['hospitality', 'retail', 'delivery', 'cleaning', 'warehouse'];

export const SHIFTS = ['morning', 'afternoon', 'evening', 'night', 'weekend'];

/** Switzerland's four national languages, plus English. */
export const LANGUAGES = ['de', 'fr', 'it', 'rm', 'en'];

/**
 * Data shapes used across the app (documentation only; no runtime cost).
 *
 * @typedef {'hospitality' | 'retail' | 'delivery' | 'cleaning' | 'warehouse'} Category
 * @typedef {'morning' | 'afternoon' | 'evening' | 'night' | 'weekend'} Shift
 * @typedef {'full-time' | 'part-time' | 'casual' | 'flexible'} EmploymentType
 * @typedef {'immediately' | 'this week' | 'next week'} StartsAt
 * @typedef {'de' | 'fr' | 'it' | 'rm' | 'en'} Language
 * @typedef {'USD' | 'CHF'} Currency
 *
 * @typedef {{ latitude: number, longitude: number }} Coordinates
 *
 * @typedef {object} Employer
 * @property {string} id
 * @property {string} name
 * @property {string} monogram
 * @property {number} baseInterest 0–1: how likely this employer is to say yes before profile fit is considered.
 * @property {[number, number]} responseDelayMs Min/max ms before the employer "responds" to a like.
 * @property {string} contact
 *
 * @typedef {{ days: string, time: string, shift: Shift }} ScheduleSlot
 *
 * @typedef {object} Job
 * @property {string} id
 * @property {string} employerId
 * @property {string} title
 * @property {Category} category
 * @property {number} payPerHour In `currency`.
 * @property {Currency} [currency] Defaults to USD.
 * @property {boolean} [tips]
 * @property {Shift[]} shifts
 * @property {ScheduleSlot[]} schedule
 * @property {{ min: number, max: number }} hoursPerWeek
 * @property {EmploymentType} employmentType
 * @property {Coordinates} location
 * @property {string} area
 * @property {string[]} requirements
 * @property {StartsAt} startsAt
 * @property {number} postedDaysAgo
 * @property {string} description
 * @property {Language[]} [languages] Any one of these is enough to do the job.
 *
 * @typedef {object} WorkerProfile
 * @property {string} name
 * @property {Category[]} categories
 * @property {Shift[]} shifts
 * @property {number} minPayPerHour USD.
 * @property {number} maxDistanceKm
 * @property {number} experienceYears
 * @property {boolean} hasTransport
 * @property {Language[]} languages Empty = not stated, so no job is penalised.
 *
 * @typedef {'like' | 'pass'} SwipeDirection
 * @typedef {{ jobId: string, direction: SwipeDirection, at: number }} Swipe
 *
 * @typedef {'matched' | 'declined'} InterestOutcome
 * @typedef {'pending' | InterestOutcome} InterestStatus
 *
 * @typedef {object} LikedJob
 * @property {string} jobId
 * @property {InterestStatus} status
 * @property {number} likedAt
 * @property {number} resolveAt When the employer "responds".
 * @property {InterestOutcome} outcome Precomputed by the interest service, revealed at resolveAt.
 * @property {number} [resolvedAt]
 *
 * @typedef {object} Features All normalised to 0–1.
 * @property {number} proximity
 * @property {number} category
 * @property {number} pay
 * @property {number} shiftFit
 * @property {number} urgency
 * @property {number} language 1 if the worker speaks one of the job's languages (or either list is empty).
 * @property {number} affinity
 *
 * Reasons and warnings carry no text: the UI words them in the worker's language (src/i18n/format.js).
 * @typedef {'distance' | 'pay' | 'shifts' | 'urgency' | 'category' | 'affinity' | 'language'} ReasonKind
 * @typedef {{ kind: ReasonKind, params: object }} Reason
 * @typedef {'belowMinPay' | 'partialShifts' | 'language'} WarningKind
 * @typedef {{ kind: WarningKind, params: object }} Warning
 *
 * @typedef {object} RankedJob
 * @property {Job} job
 * @property {number} distanceKm
 * @property {number} score 0–100
 * @property {Features} features
 * @property {Reason[]} reasons
 * @property {Warning[]} warnings
 */
