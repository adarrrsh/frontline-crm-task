# Frontline Jobs: Development Plan

A Tinder-style iOS prototype that helps frontline workers find nearby jobs. The worker swipes right to show interest, swipes left to pass, and gets simulated mutual matches from employers.

Timebox: **6–8 hours.** If time runs out, the core flow (profile → location → swipe → match) comes first.

---

## 1. Stack

| Area | Choice |
|---|---|
| Framework | Expo (latest SDK) + React Native, JavaScript (JSDoc types in `domain/types.js`) |
| Platform | iOS only (Simulator: Features → Location → Custom Location) |
| Backend | None. Bundled mock data plus a local service layer |
| State | Zustand + `persist` (AsyncStorage) |
| Location | `expo-location` |
| Gestures | `react-native-reanimated` + `react-native-gesture-handler` (custom deck) |
| Navigation | Expo Router (file-based) |
| Styling | `StyleSheet` + `src/theme.js` |
| Tests | Jest (`jest-expo`) for pure logic |

---

## 2. Architecture

### 2.1 Layers and dependency rule

```
┌──────────────────────────────────────────────────────────────┐
│ UI          app/ (routes)  ·  components/                    │  renders, handles gestures
├──────────────────────────────────────────────────────────────┤
│ Application hooks/  (useJobFeed, useSwipeActions,            │  wires state + domain
│                     useEffectiveLocation, useMatchResolver)  │
├───────────────────────────────┬──────────────────────────────┤
│ State   store/                │ Adapters  repositories/      │  state & I/O
│  useAppStore      (persisted) │   JobRepository  (mock)      │
│  useLocationStore (memory)    │   InterestService (mock)     │
│  useCatalogStore  (memory)    │   locationAdapter (expo)     │
│  useUiStore       (memory)    │                              │
├───────────────────────────────┴──────────────────────────────┤
│ Domain      domain/  — pure JS: types, geo, ranking,         │  no React / Expo
│             affinity, reasons, matching, interest            │
└──────────────────────────────────────────────────────────────┘
```

- Dependencies only point **downward**. `domain/` imports nothing outside itself. `data/` (mock JSON-like arrays) is imported **only** by the mock repositories.
- Screens never call `expo-location`, the repositories, or the domain directly. They go through hooks.
- Time comes from an injected `now()` (default `Date.now`), so ranking freshness and match timers stay deterministic in tests.

### 2.2 State ownership

| Store | Persisted | Holds | Key actions |
|---|---|---|---|
| `useAppStore` | ✅ AsyncStorage, `version: 1` + `migrate` | `profile`, `hasOnboarded`, `swipes[]`, `likedJobs{}` (with `resolveAt` + `outcome`), `locationMode: 'device' \| 'manual'`, `manualLocation` | `saveProfile`, `setRadius`, `recordSwipe`, `addPendingInterest`, `resolveInterests`, `setManualLocation`, `useDeviceLocation`, `resetDemo` |
| `useLocationStore` | ❌ | `status: idle \| requesting \| granted \| denied \| unavailable`, `coords`, `error`, `canAskAgain` | `request()`, `retry()`, `refreshOnForeground()` |
| `useCatalogStore` | ❌ | `status: idle \| loading \| ready \| error`, `jobs`, `employersById` | `load()` (once, via `JobRepository`) |
| `useUiStore` | ❌ | `matchQueue: jobId[]` (matches waiting to be celebrated) | `enqueueMatches`, `dismissMatch` |

**Derived, never stored:** the effective origin, the ranked deck, category affinity, and the Liked/Matches lists. Hooks compute them with `useMemo` and narrow selectors, so there is one source of truth and nothing to keep in sync.

### 2.3 Adapters (seams for a future backend)

```ts
interface JobRepository {
  getJobs(): Promise<Job[]>;
  getEmployers(): Promise<Employer[]>;
}
interface InterestService {          // "send interest to employer"
  submit(job: Job, profile: WorkerProfile, now: number):
    Promise<{ resolveAt: number; outcome: 'matched' | 'declined' }>;
}
interface LocationAdapter {          // thin wrapper over expo-location
  getPermission(): Promise<PermissionState>;
  requestPermission(): Promise<PermissionState>;
  getPosition(timeoutMs: number): Promise<Coordinates>;   // last-known first, then current
  openSettings(): void;
}
```
- The mock implementations add 200–400 ms of latency, so loading states are real.
- `MockInterestService` uses `domain/matching.js` to **precompute** the outcome and `resolveAt`. A real backend would instead return `pending` and push the result later. The README names this as a known simplification.
- `repositories/index.js` is the **composition root**: it exports the active implementations. Tests replace them with fakes.

### 2.4 Key flows

**App boot (`app/_layout.jsx`)**
1. Wrap the app in `GestureHandlerRootView` and keep the splash screen up until `useAppStore` has hydrated.
2. `useCatalogStore.load()` starts loading jobs and employers. On failure, an `EmptyState` offers a retry.
3. `hasOnboarded` false → redirect to `/onboarding`. Otherwise, show the tabs.
4. Mount `<MatchResolver/>` and `<MatchModalHost/>` once at the root, so they work on every tab.

**Location → deck**
```
device GPS ─► locationAdapter ─► useLocationStore ─┐
manualLocation (useAppStore) ──────────────────────┼─► useEffectiveLocation() ─► origin + source
                                                   │
catalog + profile + swipes + origin ───────────────┴─► useJobFeed() ─► rankJobs() ─► pinned top-2 ─► <SwipeDeck/>
```
- `useEffectiveLocation` uses `manualLocation` when `locationMode === 'manual'`, otherwise GPS coordinates. It also returns `source` and `status` for the banner and empty states.
- The location permission request happens on the **last onboarding step**, after a short primer screen explaining why. Discover retries if the status is still `idle`. `AppState` → `active` calls `refreshOnForeground()`, so changes made in Settings take effect.

**Swipe → interest → match**
```
SwipeDeck onSwipe(job, dir)
  └─ useSwipeActions
       ├─ recordSwipe(job.id, dir)                         // deck advances immediately (optimistic)
       └─ if like: InterestService.submit(job, profile, now)
                    └─ addPendingInterest({ jobId, resolveAt, outcome })   // persisted

<MatchResolver/> (root)
  └─ useMatchResolver: single setTimeout to the earliest resolveAt
       ├─ also runs on hydration + app foreground (catches up after kill/background)
       └─ due = domain/interest.dueInterests(likedJobs, now)
            ├─ resolveInterests(due)                       // pending → matched | declined
            └─ enqueueMatches(matched ids) ─► <MatchModalHost/> shows "It's a match!" one at a time
```

**Reset demo:** `resetDemo()` clears swipes, likes and the match queue but keeps the profile. Affinity and the deck reset automatically because they are derived.

### 2.5 Error handling
- Route-level `ErrorBoundary` (Expo Router export) at the root shows a friendly "Something went wrong" screen with a **Reload** button.
- Persisted state goes through `migrate`. If parsing fails, the app falls back to defaults rather than crashing.
- `InterestService.submit` failure: the swipe stays recorded and `useSwipeActions` retries sending interest (3 attempts with backoff). This won't happen with the mock, but the code path is ready for a real backend.

### 2.6 Project structure

```
src/app/                          # Expo Router routes (SDK 57 keeps them under src/; thin: layout + hooks + components)
  _layout.jsx                     # providers, hydration gate, onboarding redirect, MatchResolver, MatchModalHost
  onboarding.jsx                  # profile form → location primer
  (tabs)/
    _layout.jsx                   # tab bar (+ Matches badge)
    index.jsx                     # Discover
    liked.jsx                     # Liked jobs with status
    matches.jsx                   # Mutual matches
    profile.jsx                   # Preferences, radius, location mode, reset
  job/[id].jsx                    # Job detail
src/
  domain/                         # PURE — unit tested
    types.js
    geo.js                        # haversine, formatDistance
    ranking.js                    # candidates → features → score → sort → diversify
    affinity.js                   # Beta-smoothed category like-rate
    reasons.js                    # "why this job" chips + warnings
    matching.js                   # deterministic employer-interest simulation
    interest.js                   # dueInterests(), nextResolveAt()
    weights.js                    # ranking WEIGHTS + tuning constants
  data/                           # mock fixtures (only imported by mock repos)
    jobs.js · employers.js · demoLocations.js · demoProfile.js
  repositories/
    types.js                      # JobRepository, InterestService, LocationAdapter
    mock/MockJobRepository.js
    mock/MockInterestService.js
    expoLocationAdapter.js
    index.js                      # composition root
  store/
    useAppStore.js · useLocationStore.js · useCatalogStore.js · useUiStore.js
  hooks/
    useEffectiveLocation.js · useJobFeed.js · useSwipeActions.js
    useMatchResolver.js · useAppForeground.js
  components/
    SwipeDeck.jsx · JobCard.jsx · SwipeButtons.jsx · ReasonChips.jsx
    MatchModalHost.jsx · RadiusSlider.jsx · LocationBanner.jsx
    LocationPrompt.jsx            # denied / unavailable / manual picker
    EmptyState.jsx · ChipSelect.jsx
  theme.js
__tests__/
  domain/  (geo, ranking, affinity, reasons, matching, interest)
  store/   (useLocationStore with fake adapter, useAppStore actions)
```

### 2.7 Conventions
- JavaScript with JSDoc `@typedef`s for the data shapes (`src/domain/types.js`); path alias `@/` → `src/` via `jsconfig.json`.
- Components receive data as props. Only screens and the root hosts read stores.
- Zustand selectors are narrow (`useAppStore(s => s.profile.maxDistanceKm)`) to avoid needless re-renders while swiping.
- Swipe animations run on the UI thread (Reanimated worklets). The JS thread is touched only once per committed swipe (`runOnJS(onSwipe)`).
- Domain functions take explicit inputs, including `now`.

---

## 3. Data model

```ts
type Category = 'hospitality' | 'retail' | 'delivery' | 'cleaning' | 'warehouse';
type Shift = 'morning' | 'afternoon' | 'evening' | 'night' | 'weekend';

interface Coordinates { latitude: number; longitude: number }

interface Employer {
  id: string; name: string; logoEmoji: string;
  baseInterest: number;            // 0–1, how picky the employer is
  responseDelayMs: [number, number];
}

interface Job {
  id: string; employerId: string;
  title: string; category: Category;
  payPerHour: number;              // currency shown via a single locale setting
  shifts: Shift[]; hoursPerWeek: number;
  employmentType: 'full-time' | 'part-time' | 'casual';
  location: Coordinates; area: string;   // human-readable suburb/neighbourhood
  requirements: string[];          // e.g. "Food safety cert", "Own bike"
  startsAt: 'immediately' | 'this week' | 'next week';
  postedDaysAgo: number;
}

interface WorkerProfile {
  name: string;
  categories: Category[];          // interested categories
  shifts: Shift[];                 // availability
  minPayPerHour: number;
  maxDistanceKm: number;           // travel radius, 1–50
  experienceYears: number;
  hasTransport: boolean;
}

type SwipeDirection = 'like' | 'pass';
interface Swipe { jobId: string; direction: SwipeDirection; at: number }

type InterestStatus = 'pending' | 'matched' | 'declined';
interface LikedJob {
  jobId: string; status: InterestStatus; likedAt: number;
  resolveAt: number;                    // when the employer "responds"
  outcome: 'matched' | 'declined';      // precomputed by MockInterestService, revealed at resolveAt
  resolvedAt?: number;
}
```

---

## 4. Mock data

- **Region:** San Francisco Bay Area. The iOS Simulator's default location (Apple Park, Cupertino) is inside this region, so reviewers see jobs right away.
- **Clusters** (about 6–8 jobs each, with realistic employers and pay):
  - Cupertino / Sunnyvale (0–8 km from default)
  - San Jose downtown (~15 km)
  - Palo Alto / Mountain View (~10–15 km)
  - Fremont (~30 km)
  - San Francisco (~65 km)
- This spread lets the demo show the radius effect clearly: 5 km → a handful of jobs, 25 km → most of the South Bay, 50 km+ → SF is still out of range until the location is moved to SF.
- **Demo locations** (`demoLocations.js`): Cupertino, San Jose, San Francisco. These are used for the manual fallback and for demonstrating location changes without the Simulator menu.

---

## 5. Core logic

### 5.1 Distance (`geo.js`)
- Haversine distance in km. Shown on cards as `1.2 km` or `12 km`.

### 5.2 Job suggestion algorithm (`ranking.js`, `affinity.js`, `reasons.js`)

`rankJobs(jobs, profile, origin, swipes) → RankedJob[]`, where
`RankedJob = { job, distanceKm, score /*0–100*/, features, reasons: string[], warnings: string[] }`

All of it is pure functions with no I/O, and the result is deterministic: the same inputs always give the same order.

#### Pipeline

```
jobs ─► 1. Candidates ─► 2. Features ─► 3. Score ─► 4. Sort ─► 5. Diversify ─► 6. Explain ─► deck
         (hard filters)    (0–1 each)    (weighted   (score,     (interleave    (reasons +
                                          + learned)  distance,   categories/    warnings)
                                                      id)         employers)
```

#### Step 1: Candidates (hard filters, the only things that hide a job)
- Not already swiped (liked or passed).
- `distanceKm ≤ profile.maxDistanceKm`, using haversine from the current origin (GPS or manual).

Everything else (category, pay, shifts) is a **soft** signal. Soft signals reorder the deck but never empty it, so a small radius still shows something useful.

#### Step 2: Features (each normalised to 0–1)

| Feature | Formula | Intuition |
|---|---|---|
| **Proximity `P`** | `exp(−d / k)`, where `k = radius × 0.5` with own transport and `radius × 0.3` without | Anything close scores near full, and the score falls off smoothly. Without transport, distance matters more |
| **Category `C`** | `1` if the category is in `profile.categories` (or none picked), otherwise `0.3` | Strong boost, but other categories stay visible |
| **Pay `Y`** | `clamp(0.5 + (pay − minPay) / 10, 0, 1)` | At the minimum scores 0.5; $5 or more above scores 1; $5 below scores 0 |
| **Shift fit `S`** | `|job.shifts ∩ worker.shifts| / |job.shifts|` (1 if the worker set no shifts) | Share of the job's shifts the worker can actually do |
| **Urgency `U`** | `0.6 × start + 0.4 × fresh`, where `start` is 1 for immediately, 0.6 for this week, 0.2 for next week, and `fresh = max(0, 1 − postedDaysAgo / 14)` | Frontline workers often need work soon |

Proximity check (radius 10 km, with transport, so k = 5): 1 km → 0.82, 5 km → 0.37, 10 km → 0.14.

#### Step 3: Score

```
base     = 0.35·P + 0.20·C + 0.20·Y + 0.15·S + 0.10·U        // weights sum to 1
learned  = 0.15 · (2·A(category) − 1)                         // −0.15 … +0.15
score    = round(100 · clamp(base + learned, 0, 1))
```
- Proximity has the **largest single weight**, so location clearly drives the order as well as the radius filter.
- All weights live in one exported `WEIGHTS` constant, so they are easy to tune and the README documents them.

#### Learned affinity `A` (`affinity.js`)
A Beta(1,1)-smoothed like rate per category, computed from the swipe history:

```
A(cat) = (likes(cat) + 1) / (likes(cat) + passes(cat) + 2)
```
- With no swipes, A = 0.5 and the adjustment is 0, so a fresh profile gets pure profile-based ranking.
- 3 likes and 0 passes gives 0.80, a +0.09 boost. 0 likes and 4 passes gives 0.17, a −0.10 penalty.
- Smoothing stops one swipe from swinging the feed. The ±0.15 cap keeps learning from overriding distance or the stated preferences.
- It is derived from `swipes` on every rank call. Nothing extra is stored, and **Reset demo data** clears it too.

#### Step 4: Sort
By `score` descending, then `distanceKm` ascending, then `job.id`, so the order is fully deterministic.

#### Step 5: Diversity rerank (greedy, bounded)
Go down the sorted list. Before placing the next job, check whether it would make **3 of the same category in a row** or **2 of the same employer in a row**. If so, look ahead up to 3 positions for the first job that breaks the run **and** scores at most 10 points lower, and swap it forward. If nothing qualifies, keep the original order. The rerank never promotes a much worse job just to add variety.

#### Step 6: Explain (`reasons.js`)
Each feature's weighted contribution is compared, and the top 2 positive reasons appear as chips on the card:

| Trigger | Chip |
|---|---|
| `P ≥ 0.6` | `📍 1.2 km away` |
| pay ≥ min + $2 | `💰 $3/hr above your minimum` |
| `S = 1` | `🕒 Fits your evening availability` |
| starts immediately | `⚡ Starts immediately` |
| preferred category | `⭐ Matches your Retail preference` |
| `A ≥ 0.65` | `💚 Similar to jobs you liked` |

Warnings are shown separately in amber and are never hidden: `Below your minimum pay`, `Only some shifts fit you`.

#### Deck stability
The ranking re-runs when the location, radius, profile or swipes change. **The top 2 cards (the visible one and the one underneath) stay pinned**, so cards never reshuffle under the worker's finger. Re-ranking only affects the queue behind them.

#### Worked example
Worker: Retail + Hospitality, morning/afternoon/weekend shifts, min $18, has transport, 10 km radius, no swipes yet.

| Job | d | Pay | P | C | Y | S | U | Score |
|---|---|---|---|---|---|---|---|---|
| Barista (hospitality, morning + weekend, starts now, 2 days ago) | 1.5 km | $20 | 0.74 | 1 | 0.7 | 1 | 0.94 | **84** |
| Retail assistant (afternoon, next week, 7 days ago) | 8 km | $17 | 0.20 | 1 | 0.4 | 1 | 0.32 | **53** |
| Warehouse picker (night, this week, 1 day ago) | 4 km | $24 | 0.45 | 0.3 | 1 | 0 | 0.73 | **49** |

After the worker likes 3 warehouse jobs, A(warehouse) = 0.80, which adds 9 points. The picker moves to **58** and overtakes the retail job. The deck visibly learns, which is useful to show in the demo.

### 5.3 Employer interest simulation (`matching.js`)
`simulateEmployerInterest(job, employer, profile) → { matched: boolean; delayMs: number }`

- `probability = employer.baseInterest + fitBonus`, clamped to 0.05–0.95.
  - +0.15 if the worker's shifts cover all of the job's shifts
  - +0.10 if `experienceYears ≥ 1`
  - +0.10 for delivery jobs when `hasTransport` is true; −0.30 when it is false
- **Deterministic:** a seeded hash of `jobId + profile.name` gives a value from 0 to 1, so the same profile always gets the same result. Reviewers can reproduce matches, and the README lists a few jobs that are guaranteed to match.
- **Delay:** 1.5–4 s (taken from the employer's settings). The liked job shows "Pending" until the delay ends, then becomes **matched** (match modal + Matches tab badge) or **declined** (shown quietly in the Liked list).
- Pending likes resume after a relaunch: `resolveAt` is persisted, and `useMatchResolver` catches up on hydration and when the app returns to the foreground (see 2.4).

---

## 6. Location handling (`useLocationStore` + `expoLocationAdapter`)

A small state machine that drives the UI:

| State | UX |
|---|---|
| `requesting` | Skeleton deck with the text "Finding jobs near you…" |
| `granted` + position | Normal feed. The banner shows "Near Cupertino · 10 km radius" |
| `denied` | Explanation card with **Open Settings** and **Choose a location manually** (demo locations) |
| `unavailable` / timeout (10 s) | "Couldn't get your location" with **Retry** and **Choose manually** |
| `manual` | Feed uses the chosen location. The banner says "Using manual location" and offers "Use my location" |

- Use `getLastKnownPositionAsync` first so the first result is fast, then `getCurrentPositionAsync` (Balanced accuracy).
- Re-check permission when the app returns to the foreground (`AppState`), so turning permission on in Settings takes effect.
- Add the `NSLocationWhenInUseUsageDescription` text in `app.json`.

### Empty and edge states on Discover
- **No jobs in radius:** "No jobs within 5 km" with buttons to **Increase to 15 km** and **Edit categories**.
- **Deck exhausted:** "You've seen everything nearby" with a link to Liked jobs and an increase-radius button.
- **Rewind:** an "Undo last pass" button. This is a stretch goal.

---

## 7. Screens and UX

1. **Onboarding** (first launch only). Collects name, categories (chips), shifts (chips), minimum hourly pay (stepper), experience, a "has own transport" toggle, and travel radius. The worker can skip with a prefilled demo profile, which saves reviewers time.
2. **Discover.** Location banner plus radius quick-adjust, the swipe deck, and Pass/Like buttons.
   - Card shows: employer emoji/logo, title, employer, **pay/hr**, **distance + area**, shifts, hours/week, start date, the top 2 "why this job" reason chips, and any amber warnings (see 5.2).
   - Gesture: rotation and translation follow the finger, with LIKE/NOPE labels whose opacity tracks the drag. A swipe commits past 30% of screen width or on a fast fling; otherwise the card springs back. Light haptics fire on commit (`expo-haptics`).
3. **Liked.** Lists liked jobs with a status pill (Pending / Matched / Not this time). Tapping opens the job detail.
4. **Matches.** Lists matched jobs with the text "Employer wants to talk to you" and a mock "Contact" button that only shows a toast, since chat is out of scope.
5. **Profile.** Edit preferences and radius, with a **Reset demo data** button that clears swipes and matches for re-testing.
6. **Match modal.** A full-screen "It's a match!" appears when a match resolves while the worker is in the app.

Accessibility: buttons duplicate every gesture, cards have accessibility labels summarising the job, and touch targets are at least 44 pt.

---

## 8. Store

See section 2.2 for store ownership, persisted fields, and actions.

---

## 9. Milestones

| # | Milestone | Est. | Done when |
|---|---|---|---|
| 1 | Scaffold Expo + TS + Router, `@/` alias, deps, theme, tab shell, folder skeleton | 0.5 h | App boots in the iOS Simulator with 4 tabs |
| 2 | Domain: types, mock data, `geo`, `ranking`/`affinity`/`reasons`, `matching`, `interest` + Jest tests | 2 h | `npm test` passes |
| 3 | Repositories + composition root, all 4 stores, hydration gate, onboarding + profile screens | 1 h | Profile persists across reloads |
| 4 | `expoLocationAdapter`, `useLocationStore`, `useEffectiveLocation`, location primer + all states + manual fallback | 1 h | Denied/unavailable/manual paths all work in the Simulator |
| 5 | `useJobFeed` (with pinning), swipe deck, job card, reason chips, buttons | 1.5 h | Swiping updates the store; radius changes the deck |
| 6 | `useSwipeActions`, `MockInterestService`, `useMatchResolver`, match modal host, Liked / Matches, job detail | 1 h | Likes resolve to matched/declined |
| 7 | Empty states, polish, haptics, README | 0.5–1 h | README complete; fresh-clone run verified |

**Cut line if time runs short:** the job detail screen, undo, haptics, and the diversity rerank go first. Location states, swipe, and matching are never cut.

---

## 10. Testing

**Unit (Jest):**
- `geo`: known city-pair distances (within 1% tolerance), and zero distance.
- `ranking`: radius is the only hard filter; already-swiped jobs are excluded; closer jobs rank higher when other factors are equal; no-transport decay is steeper; non-preferred categories are kept but ranked lower; below-min-pay jobs are kept but ranked lower; the order is deterministic; the worked example in 5.2 reproduces exactly (84 / 53 / 49).
- `affinity`: no swipes gives 0.5; the smoothing values match (3 likes → 0.80); the adjustment is capped at ±0.15.
- Diversity: never 3 of the same category in a row when an alternative within 10 points exists; never swaps in a job more than 10 points lower.
- `reasons`: picks the top 2 contributions; warnings appear independently.
- `interest`: `dueInterests` returns only pending likes with `resolveAt ≤ now`; `nextResolveAt` picks the earliest.
- Stores (with fake adapters + injected `now`): the location store moves correctly through granted / denied / timeout→unavailable; `resetDemo` keeps the profile and clears swipes and likes.
- `matching`: results are deterministic, probability is clamped, and the transport penalty applies.

**Manual verification script** (also included in the README):
1. Fresh install → onboarding → skip with demo profile.
2. Allow location with the Simulator at Apple (default) → Cupertino jobs appear first and distances look correct.
3. Change the radius from 5 km to 30 km → more jobs appear, and San Jose and Fremont show up.
4. Set the Simulator location to SF (37.7749, −122.4194) → the deck re-ranks to SF jobs.
5. Like the documented guaranteed-match job → after a few seconds the match modal appears and the job shows in the Matches tab.
6. Like a documented guaranteed-decline job → the Liked tab shows "Not this time".
7. Deny permission (Settings → Privacy → reset) → the explanation card appears → choose San Jose manually → the feed works.
8. Set the radius to 1 km in an empty area → the empty state shows a working increase-radius button.
9. Kill and relaunch the app → profile, likes, and matches are all still there.

---

## 11. README outline

Setup (Node version, `npm i`, `npx expo start`, press `i`) · Assumptions · Product decisions (matching rules, ranking weights) · Key tradeoffs · Known limitations · Verification steps (section 10) · Time spent · What I'd do next.

## 12. Assumptions and out of scope

- One worker per device, with no auth. Pay is shown in one currency (USD to match the Bay Area data).
- Jobs are static, with no real-time updates. No backend, chat, maps, notifications, or employer app (all per the brief).
- "Match" means the employer showed interest in reply. What happens after a match is mocked.
- **Next steps beyond scope:** a real API behind `JobRepository` / `InterestService`, push notifications for matches, map view, chat, Android build, and E2E tests (Maestro).
