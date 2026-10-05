# Shiftmatch

Swipe-to-apply for frontline jobs (hospitality, retail, delivery, cleaning, warehouse).
Your location decides which jobs you see and in what order; employers may like you back.
Works in Switzerland's four national languages: the app UI switches between English, Deutsch, Français,
Italiano and Rumantsch, and jobs are matched to the languages you speak.

**Stack:** Expo SDK 57 · React Native · JavaScript · Expo Router · Zustand (AsyncStorage) ·
Reanimated + Gesture Handler · expo-location. **Platform:** iOS. Design notes: [plan.md](plan.md).

## Setup

Needs Node 20+ and either Expo Go on an iPhone (SDK 57) or Xcode + iOS Simulator.

```bash
npm install
npm start        # scan the QR code with Expo Go (same Wi-Fi), or press i for the Simulator
npm test         # 70 unit tests (ranking, matching, languages, translations, stores)
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

**Swiss regional languages**

8. On the welcome screen tap **DE / FR / IT / RM** (or Profile → *App language*): every screen switches instantly.
9. Pick **Lugano** in the location picker. The demo profile speaks English + German, so the Italian/German cashier
   job ranks first with *You speak German*; Italian-only jobs drop lower with a *Needs Italian* warning.
   Card footers show each job's languages, ticked green where you speak them.
10. Profile → *Languages you speak* → add **Italiano**: the warnings disappear and the deck re-ranks.
    Zürich (DE), Genève (FR) and Chur (RM/DE) work the same way.

## Assumptions

- One worker per device, no login. Profile = name, experience, transport, job types, shifts, min pay, radius.
- Mock data: 35 Bay Area jobs (USD, English) and 12 Swiss jobs (CHF) in Zürich, Genève, Lugano and Chur, 42 employers.
  Distance is straight-line, not travel time.
- A job lists the languages it can be done in; speaking **any one** is enough. Workers who list no languages see no penalty.
- Minimum pay is set in USD; CHF pay is converted at a fixed demo rate (1 CHF = 1.25 USD) before comparing.
- "Match" = the employer likes you back; contacting them is mocked.

## Key tradeoffs

- **No backend**, but data sits behind async repository interfaces, so an API can be swapped in later.
- **Ranking:** only the radius hides jobs. Distance, category, pay, shifts and urgency are scored,
  plus learned preferences from swipes, so small radii don't produce an empty deck. Each card shows why it ranked.
- **Deterministic employer replies** (seeded by job + name): reproducible demos and tests, but less "random".
- **Custom swipe deck** instead of a library: more code, but smooth and fully controllable.
- **Language is a ranking penalty, not a filter** (−30 points on a mismatch, plus a warning chip and a lower employer
  reply chance), in line with "only the radius hides jobs". A worker can still choose a job they'd need to learn for.
- **Home-made i18n** (`src/i18n`, ~40 lines + one dictionary per language) instead of i18next: no new dependency.
  The domain returns reason/warning *kinds and params*, and the UI words them, so ranking stays language-free.

## Known limitations

- iOS only; not yet run on a physical device or the Simulator (checked via iOS bundle build and a web preview).
- Manual locations are 3 preset areas (no address search).
- No push notifications, chat, maps or real accounts. Replies to a closed app show on next launch.
- Tests cover logic and stores, not screens (no E2E).
- Only the app's own text is translated. Job titles, descriptions, schedules and employer names are mock data and
  stay in English. The Romansh (Rumantsch Grischun) strings are best-effort and need a native speaker's review.
- The app language defaults to English rather than following the phone's locale.

## Time spent

_≈ 2 hours

## Next steps

Real API, push notifications for matches, travel-time distance, address search, E2E tests, Android,
device-locale default (`expo-localization`), translated job content, language-proficiency levels.
