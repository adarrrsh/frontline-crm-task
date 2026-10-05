# Shiftmatch: frontline jobs, one swipe at a time

A Tinder-style iOS prototype that helps hourly workers (hospitality, retail, delivery, cleaning, warehouse) discover nearby jobs. Location decides which jobs you see and their order; a simulated employer may like you back.

Built with **Expo SDK 57 · React Native 0.86 · TypeScript (strict) · Expo Router · Zustand · Reanimated 4 · Gesture Handler**. UI follows the *Shiftmatch* design (Modernist system: Archivo, square corners, 2px rules, one red).

---

## Setup

Requirements: Node 20+ (tested on Node 24), and either **Xcode + iOS Simulator** or **Expo Go** on an iPhone.

```bash
npm install
npm run ios        # starts Metro and opens the iOS Simulator
# or: npm start → scan the QR code with Expo Go
```

Other scripts:

```bash
npm test           # Jest — domain logic + stores (46 tests)
npm run typecheck  # tsc --noEmit
npx eslint .       # Expo ESLint config, incl. React Compiler rules
```

No backend, keys or accounts are needed.

---

## How to verify

The Simulator's default location (**Features → Location → Apple**, i.e. Apple Park, Cupertino) sits in the middle of the mock data, so jobs appear immediately.

### Swipe flow
1. Fresh install → **Try with a demo profile** (Jordan: Hospitality/Retail/Delivery, mornings/evenings/weekends, $18/hr min, 10 km, own transport).
2. **Enable location** → allow. Discover shows *Near Cupertino · within 10 km*; the top card is **Barista · Fresh Bites Café · 1.5 km**.
3. Drag a card: it tilts, the **INTERESTED** / **PASS** stamp fades in, and the matching button below mirrors the gesture. Release past ~30% of the width (or flick) to commit; otherwise it springs back. **Pass** / **Interested** buttons do the same thing; **Undo** restores a pass or a not-yet-answered like.

### Simulated matches
4. Swipe right on **Barista · Fresh Bites Café** → after ~3.4 s the full-screen **It's a match!** appears and the Matches tab gets a badge. *(Guaranteed for the demo profile.)*
5. Swipe right on **Housekeeper · Hotel Vallco** (2.6 km) → it shows *Waiting for reply*, then **Not this time** in Liked. *(Guaranteed decline.)*
6. **Liked** filters All / Waiting / Matched. **Matches** shows NEW tags; the badge clears once you've visited. Tap a match → job detail with a sticky **Contact employer** (mocked sheet).
7. Kill and relaunch the app while a like is *Waiting*: the reply still arrives (reply times are persisted).

### Location-based results
8. Tap **10 km** in the header → radius sheet shows a live count (5 km → 10 jobs, 10 km → 18, 15 km → 24, 25 km → 28). Apply and the deck changes.
9. **Features → Location → Custom Location…** `37.7749, -122.4194` (San Francisco) → return to the app: the header reads *Near San Francisco* and the deck re-ranks to the SF jobs (they're ~60 km from Cupertino, so they never appear there).
10. Tap the location header → **Choose a location** → *San Jose* → manual mode (header says *Using manual location*); **Use my current location** switches back.

### Edge states
11. **Denied:** Settings → Privacy → Location Services → Shiftmatch → *Never*, return to the app → *We can't see where you are* with **Open Settings** / **Choose a location manually**.
12. **Unavailable:** Features → Location → *None* → after 10 s, *Couldn't find your location* with **Retry**.
13. **No jobs:** set 1 km → *No jobs within 1 km* with **Expand to 5 km**. Swipe everything in range → *You've seen every job nearby*.
14. **Profile → Reset demo data** clears swipes/likes/matches (profile stays); **Start over from onboarding** clears everything.

---

## How jobs are ranked

Pure, deterministic functions in `src/domain/` (`ranking.ts`, `affinity.ts`, `reasons.ts`), all unit-tested.

1. **Hard filters (the only things that hide a job):** not already swiped, and within your travel radius (haversine distance).
2. **Features (0–1 each):**
   - **Proximity:** `exp(−d / k)`, where `k = radius × 0.5`, or `× 0.3` without own transport.
   - **Category:** 1 if it's a type you picked, otherwise 0.3. Other types stay visible, just lower.
   - **Pay:** `0.5 + (pay − min) / 10`, clamped.
   - **Shift fit:** the share of the job's shifts you're available for.
   - **Urgency:** `0.6 × start + 0.4 × freshness`.
3. **Score** = `0.35·P + 0.20·C + 0.20·Y + 0.15·S + 0.10·U`, plus **learned affinity**: a Beta(1,1)-smoothed like-rate per category from your swipes, capped at ±15 points. The deck drifts toward what you like without overriding distance.
4. **Sort** by score, then distance, then id.
5. **Variety:** the deck never shows 3 of the same category or 2 from the same employer in a row, if an alternative within 10 points exists.
6. **Explain:** each card shows its top 2 contributing reasons ("1.5 km away", "$4/hr above your minimum", …), plus amber warnings (below minimum pay, shifts that don't fit) that are never hidden.

The two visible cards are **pinned**, so re-ranking after a swipe or radius change never reshuffles what's under your finger.

### Employer interest
`probability = employer.baseInterest + fit`: +0.15 if all shifts fit, +0.10 with experience, ±0.10/−0.30 for delivery with/without transport, clamped to 0.05–0.95. The roll is a hash of *job id + first name*, so it's **reproducible**: the same profile always gets the same replies, which is why the README can promise specific matches. Replies arrive after 1.5–4 s.

---

## Architecture

```
UI (src/app, src/components)  →  hooks (useJobFeed, useSwipeActions, useMatchResolver, …)
     →  stores (Zustand) + adapters (JobRepository, InterestService, LocationAdapter)
          →  domain (pure TS: geo, ranking, affinity, reasons, matching)
```

- **Stores:** `useAppStore` is persisted to AsyncStorage (versioned) and holds the profile, swipes, likes with `resolveAt` + outcome, location mode, and the matches-seen mark. The location, catalog, deck and UI stores live in memory only. The deck, affinity and the Liked/Matches lists are **derived**, never stored.
- **Adapters** are the seam for a real backend: swap `MockJobRepository` / `MockInterestService` in `src/repositories/index.ts`. Tests inject a fake `LocationAdapter`.
- **Employer replies** use timestamps, not in-memory timers. One root-level resolver aims a single timer at the earliest pending reply and catches up after hydration and when the app returns to the foreground.

Full design notes: [`plan.md`](plan.md).

---

## Assumptions

- One worker per device, with no auth. The profile is lightweight: name, experience, transport, job types, shifts, minimum pay and radius.
- The mock data is set in the **Bay Area, in USD**: 35 jobs across Cupertino, Sunnyvale, Santa Clara, Mountain View, San Jose, Palo Alto, Fremont and San Francisco. Distances are positioned exactly relative to the Simulator default.
- "Match" means the employer likes you back. What happens after that (contact) is mocked.
- Distances are straight-line distances, not travel time.

## Key trade-offs

- **No backend.** The data is local, but behind async repository interfaces with fake latency, so loading states are real and a backend is a drop-in.
- **Deterministic matching** over randomness: it makes the demo reproducible and testable, but it's less "alive".
- **The reply outcome is precomputed when you like a job** and only revealed at `resolveAt`. A real API would push the result instead.
- **Custom swipe deck** instead of a library: about 150 lines, runs on the UI thread, and is fully controllable (the buttons mirror the drag). The cost is more code to own.
- **Soft filters for category and pay**, so small radii don't produce empty decks. This means workers sometimes see off-preference jobs, which are clearly flagged.
- **Manual locations are a fixed list of 3 demo areas.** There is no geocoding, so the search box only filters that list.

## Known limitations

- iOS is the only target. During development it was checked via the iOS production bundle build and a react-native-web preview; it has not yet been run on a physical device.
- No geocoding, so the location name is the nearest demo area or "you".
- No push notifications, so a reply that lands while the app is closed is shown on the next launch.
- Undo is limited to a pass, or a like that hasn't been answered yet.
- Screen-level component and E2E tests are not included; the tests cover domain logic and stores.
- Radius changes inside the Profile screen apply immediately; there is no explicit "Save".

## What I'd do next

Real API behind `JobRepository` / `InterestService`, push notifications for matches, travel-time instead of straight-line distance, geocoded location search, Maestro E2E tests for the swipe → match flow, and an Android build.

## Time spent

_≈ X hours — fill in._
