# Shiftmatch

Swipe-to-apply for frontline jobs (hospitality, retail, delivery, cleaning, warehouse).
Your location decides which jobs you see and in what order; employers may like you back.

**Stack:** Expo SDK 57 · React Native · JavaScript · Expo Router · Zustand (AsyncStorage) ·
Reanimated + Gesture Handler · expo-location. **Platform:** iOS. Design notes: [plan.md](plan.md).

## Setup

Needs Node 20+ and either Expo Go on an iPhone (SDK 57) or Xcode + iOS Simulator.

```bash
npm install
npm start        # scan the QR code with Expo Go (same Wi-Fi), or press i for the Simulator
npm test         # 46 unit tests (ranking, matching, stores)
```

No backend, keys or accounts needed. All data is local and mocked.

## How to verify

Mock jobs are around Cupertino, the iOS Simulator's default location. On a real phone, tap the
location bar and pick **Cupertino**.

**Swipe flow**

1. Tap **Try with a demo profile**, then **Enable location** (or **Choose a location instead** → Cupertino).
2. Drag a card right (Interested) or left (Pass), or use the buttons. **Undo** restores the last pass.

**Simulated matches**

3. Swipe right on **Barista · Fresh Bites Café** → *It's a match!* after ~3 s, and a badge appears on Matches.
4. Swipe right on **Housekeeper · Hotel Vallco** → *Waiting for reply*, then *Not this time* in Liked.

**Location-based results**

5. Tap **10 km** → the sheet shows live counts (5 km: 10 jobs · 10 km: 18 · 15 km: 24 · 25 km: 28).
6. Change location to San Francisco (Simulator: Features → Location → Custom `37.7749, -122.4194`,
   or the location picker) → the deck switches to SF jobs, which are ~60 km from Cupertino.
7. Deny location in Settings → *Open Settings / Choose a location manually*. Set 1 km → *No jobs within 1 km* + **Expand**.

## Assumptions

- One worker per device, no login. Profile = name, experience, transport, job types, shifts, min pay, radius.
- Bay Area mock data in USD: 35 jobs, 30 employers. Distance is straight-line, not travel time.
- "Match" = the employer likes you back; contacting them is mocked.

## Key tradeoffs

- **No backend**, but data sits behind async repository interfaces, so an API can be swapped in later.
- **Ranking:** only the radius hides jobs. Distance, category, pay, shifts and urgency are scored,
  plus learned preferences from swipes, so small radii don't produce an empty deck. Each card shows why it ranked.
- **Deterministic employer replies** (seeded by job + name): reproducible demos and tests, but less "random".
- **Custom swipe deck** instead of a library: more code, but smooth and fully controllable.

## Known limitations

- iOS only; not yet run on a physical device or the Simulator (checked via iOS bundle build and a web preview).
- Manual locations are 3 preset areas (no address search).
- No push notifications, chat, maps or real accounts. Replies to a closed app show on next launch.
- Tests cover logic and stores, not screens (no E2E).

## Time spent

_≈ 2 hours

## Next steps

Real API, push notifications for matches, travel-time distance, address search, E2E tests, Android.
