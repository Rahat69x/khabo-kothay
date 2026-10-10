# Khabo Kothay? Project Progress Tracker

## Status Overview
- **Day 1 Stages Completed**: **Stages 0 to 6 + Dhaka Location Database Research** ✅
- **Test Pass Rate**: 🟢 **104 / 104 Tests Passing (100%) across 18 test suites**
- **Security & Contrast**: 🟢 **Zero raw colors, 100% WCAG contrast passing, zero secret leaks**
- **Next Phase**: **P3 - Ask in your own words, by text or voice (SHOULD)**

---

## What Was Completed in Phase P2

### 1. Departure Time Predictions ("Leave now or later")
- **Prediction Matrix**: Computes future predicted traffic at `+0`, `+15`, `+30`, and `+60` minutes for top 3 candidates via Google Routes API `departureTime` with graceful fallback to a Dhaka diurnal congestion curve.
- **Actionable Suggestions**: Generates suggestions when departing later saves significant time (e.g., *"Leave in 30 min to save 11 min (predicted)"*).
- **Truth-in-Data**: Every prediction item and suggestion is explicitly tagged with `isPrediction: true` and `label: "predicted"`.

### 2. Time-Budget Mode ("I have 45 minutes")
- **Round-Trip + Dining Time**: Automatically computes round-trip travel (`2 * oneWayDuration`) plus configurable cuisine-specific dining duration from `server/config/context.json` (e.g. Coffee: 15m, Fast Food: 20m, Bangladeshi/Biriyani: 30-35m, Fine dining: 60m).
- **Strict Budget Dropping**: Drops any restaurant whose round-trip travel plus dining duration exceeds the user's available time.
- **Closing-Soon Protection**: Drops places that close before arrival time plus dining duration.

### 3. Personal Weights Multi-Armed Bandit
- **Stochastic Weight Learning**: Learned factor weights (`time`, `cost`, `rating`, `distance`, `price`, `traffic`, `taste`) updated using an epsilon-greedy bandit from explicit user selections.
- **Strict Guardrails**:
  - Box constraints: every factor weight stays strictly between `0.05` (5%) and `0.50` (50%).
  - Projected onto the probability simplex so that $\sum w_i = 1.0$.
  - Slow, stable learning rate ($\eta = 0.05$).
  - Full reset endpoint restoring default baseline weights.
  - On/off switch allowing users to pause personalization anytime.
  - Plain-language explanation note (e.g., *"You often pick faster places, so speed counts a bit more for you now."*).

### 4. Context Signals & Multi-Companion Mapping
- **Time of Day Slots**: Mapped through `server/config/context.json` for breakfast, lunch, afternoon adda, dinner, and late-night cravings (+5 points boost for matching cuisines).
- **Dhaka Weekend**: Recognizes Friday and Saturday (UTC+6) with leisure dining bonuses.
- **Companion Modes**: Mapped through config for `alone`, `friends`, `family`, and `date` with specific weight adjustments and cuisine affinities.

### 5. Preference Filters & Strict Allergen Safety
- **Dietary & Spice Filters**: Supported filters for Halal, Vegetarian, No Beef, and Spice Levels.
- **Unverified Label**: Because Google Places dietary tags are unreliable, all results are explicitly marked `unverified`.
- **Mandatory Disclaimer**: Never claims allergen safety anywhere. Responses include: *"Dietary and spice preferences are unverified and estimated. Never rely on this for allergen safety."*

### 6. Counterfactual Explanations
- **Comparative Analysis**: Compares the top recommendation with the candidate that would win under an alternative priority (Cheapest or Fastest).
- **Transparent Trade-offs**: Emits plain-language notes (e.g., *"If you chose Cheapest: B saves ৳40 but adds 12 min."*).

### 7. Evaluation Harness & Replay Framework
- **Anonymized Session Logger**: `server/services/eval-logger.js` records impressions, opens, and directions to `server/data/eval-sessions.jsonl` without PII.
- **CLI Replay Harness**: `scripts/eval.js` replays recorded sessions and reports top-1 and top-3 hit rates and Mean Reciprocal Rank (MRR) across baseline, bandit, and A/B test configurations.

---

## What Changed in the API

| Endpoint | Method | Change / Additions |
|---|---|---|
| `/api/v1/recommend` | `POST` | Added `timeBudgetMinutes`, `companion`, `preferences` request parameters. Returns `departurePredictions` (+0, +15, +30, +60 min), `counterfactual` explanations, `banditNote`, and `allergenDisclaimer`. |
| `/api/v1/bandit/weights` | `GET` | Returns learned factor weights, bounds `[0.05, 0.50]`, and plain-language explanation note. |
| `/api/v1/bandit/update` | `POST` | Updates bandit weights based on chosen candidate in candidate pool. |
| `/api/v1/bandit/reset` | `POST` | Resets personal weights back to default baseline weights. |
| `/api/v1/bandit/toggle` | `POST` | Enables or disables bandit personalization. |
| `/api/v1/taste/event` | `POST` | Automatically feeds interactions to bandit learner and anonymized evaluation logger. |

---

## Upcoming Phases Roadmap

- [x] **P1 - Reliability, cost control and operations (MUST)** — Completed ✅
- [x] **P2 - Smarter decisions (MUST)** — Completed ✅
- [ ] **P3 - Ask in your own words, by text or voice (SHOULD)** — "Ask Khabo Kothay" natural language box via Anthropic API with rule-based fallback, editable chips, voice input with bn-BD and en-US support.
- [ ] **P4 - Group decisions and sharing (SHOULD)** — Multi-origin group optimization sessions, deep linking (`khabokothay://r/<placeId>`), swipe mode.
- [ ] **P5 - Personal food story and utilities (SHOULD)** — Food visit diary, 2-3 stop outing planner, delivery deep links, optional Ramadan/prayer timing mode.
- [ ] **P6 - Local data quality and community (SHOULD)** — Community reports, verification thresholds, admin portal.
- [ ] **P7 - Accounts and sync (NICE)** — Google sign-in, cloud sync, data export.
- [ ] **P8 - Polish and experience (MUST)** — Design system tokens, Bengali typography (Noto Sans Bengali), data saver mode, accessibility pass.
- [ ] **P9 - Security, privacy and release readiness (MUST)** — Google Play Integrity verification, OWASP API review, Play Store preparation.
- [ ] **P10 - Measure and maintain (SHOULD)** — Privacy-friendly KPI telemetry, in-app problem report, changelog.

---

## Day 1 Stages 0 to 6 Implementation & Deliverables

### Stage 0: Safety and Project Hygiene
- Created `.git/hooks/pre-commit` wired to `scripts/security-check.js` to block committing API keys.
- Implemented Google API hard daily quota cap in `server/services/quota.js` (default 200/day).
- Added `GET /api/admin/usage` endpoint for daily quota tracking.
- Created `docs/SETUP_GOOGLE.md` with step-by-step console setup, key restrictions, and billing alerts.
- Populated `docs/prompts/README.md` and placeholder prompt templates `01-day1.md` through `08-future.md`.

### Stage 1: Data Reality Check
- Created `scripts/data-check.js` supporting `--dry-run`, `--limit`, and offline evaluation.
- Generated `docs/DATA_CHECK.md` auditing field mask availability, pricing voids, and billing cost impacts.

### Stage 2: Thin Vertical Slice
- Full end-to-end recommendation flow in `server/services/recommend.js` with 10-minute caching.
- Verified traffic-aware ranking: closer place in heavy traffic loses to farther place in light traffic.

### Stage 3: Installable PWA
- Configured `public/manifest.webmanifest` and `public/sw.js` for standalone home screen install and offline shell caching.
- Wired native `beforeinstallprompt` event in `public/js/app.js` with install button.
- Documented bilingual installation guide in `docs/INSTALL_PHONE.md`.

### Stage 4: Real Fare Tuning
- Configured default fare matrix in `config/fares.json` and sample log in `docs/fare-log.csv`.
- Built `scripts/tune-fares.js` using ordinary least squares regression to calculate suggested base/km fares in `config/fares.suggested.json`.
- Added vitest tests in `server/tests/tune-fares.test.js`.

### Stage 5: Tester Feedback Loop
- Added in-app feedback card asking *"Did the top pick make sense?"* with Yes/No/Not sure.
- Mounted rate-limited `POST /api/feedback` appending to `server/data/feedback.jsonl`.
- Built `scripts/feedback-report.js` and bilingual tester guide in `docs/TESTER_GUIDE.md`.

### Stage 6: Scope & Postponed Features
- Created `docs/SCOPE.md` detailing personal/friends testing checklist vs public release checklist.
- Documented feature flags and architectural constraints in `docs/DECISIONS.md`.

### Complete Dhaka Location Database
- Comprehensive geographic coverage research covering Level 1 (DNCC & DSCC) and Level 2 (Greater Dhaka / RAJUK DAP).
- Built 118 verified canonical location records in `server/data/dhaka-locations.json` with 24 required attributes.

### Meal-Time Mode Implementation Deliverables
- **Config**:
  - `config/mealtime.json`: 4 meal modes (Breakfast 30m, Lunch 45m, Evening Snacks 30m, Dinner 90m), mode x venue-type duration matrix, peak-hour additions (+3m lunch, +5m dinner), buffer multipliers (Safe 1.5x, Balanced 1.0x, Flexible 0.5x), transport speeds, and weights strictly summing to 1.00 per mode.
  - `config/meal-keywords.json`: Places API (New) verified types and Dhaka local food keywords (`paratha`, `halwa-ruti`, `singara`, `fuchka`, `chotpoti`, `jhalmuri`, `cha`, `bakarkhani`).
- **Backend Service & Routing**:
  - `server/services/mealtime.js`: Time-feasibility engine (`Total = outbound + wait + eat + return + buffer`), `spare = available - total`. Feasibility as hard gate. Two-leg independent routing with predicted return traffic at `leaveTime + outbound + wait + eat`. Opening check in `Asia/Dhaka` timezone with 30m kitchen last-order margin and midnight crossing. Geometry pruning for Google API cost control. Computed alternatives engine for relaxations with real counts.
  - `server/routes/api.js`: Mounted `POST /api/v1/meal-time/search` (and `/api/meal-time/search`) with validation, rate limiting, and public transport rejection. Mounted `POST /api/v1/meal-time/feedback`.
  - Feature flag `mealTimeMode` in `server/config/featureFlags.js` (`process.env.FEATURE_MEAL_TIME_MODE !== 'false'`).
- **Web App (`/public`)**:
  - Mode tab switcher in `public/index.html` toggling Standard Recommender and Meal-Time Mode.
  - `public/js/mealtime-ui.js`: Interactive flow (Mode, Duration, Return destination, Transport, Dining style, Buffer preference, Leave At). Segmented time bar with SVG icons, status chips (`SAFE`, `TIGHT`), "Back by" time, flags, explain sheet, flexible slightly-over collapsible section, computed alternatives, and trip feedback.
  - `public/css/style.css`: Theme token styling without raw hex colors.
- **Mobile Expo Android App (`/mobile`)**:
  - Segmented mode switcher in `mobile/src/features/home/HomeScreen.js`.
  - `mobile/src/features/home/MealTimeView.js`: Full mobile Meal-Time Mode flow, time chips (15, 30, 45, 60, 90, Custom), device-only saved places (Office, Home, University) with prompt, transport chips with Dhaka transit rejection notice, segmented time bar with icon glyphs, status badges, plain-language reasons, flags, explain modal sheet, flexible slightly-over collapsible section, and feedback form.
  - `mobile/src/services/storage.js`: Device-only storage for saved personal places.
  - `mobile/src/api/client.js`: Methods for `searchMealTime` and `sendMealTimeFeedback`.
- **Scripts**:
  - `scripts/tune-mealtime.js`: Feedback processor computing median durations per `(mode, venueType)` when $\ge 5$ records exist, outputting to `config/mealtime.suggested.json`.
  - `scripts/mealtime-demo.js`: Executable demo printing 45-minute Gulshan lunch results.
- **i18n**:
  - English (`en.js`) and Bangla (`bn.js`) updated with complete `mealTime` strings; verified 140 / 140 keys with 100% parity.
- **Quality & Verification**:
  - Unit tests in `server/tests/mealtime.test.js` (13 tests) and integration tests in `server/tests/mealtime-api.test.js` (6 tests).
  - Mobile tests in `mobile/__tests__/api.test.js` passing.
  - Zero raw hex colors verified via `scripts/check-no-raw-colors.js`.
  - 100% WCAG contrast passing via `scripts/check-contrast.js`.



---

## Phase P0: Environment and Diagnosis (Android Blueprint v3)

### Environment Diagnostic Status
- **Java 17**: 🟢 **PASS** — `openjdk version "17.0.20.1" 2026-08-18 (Temurin-17.0.20.1+1)`
- **ANDROID_HOME**: 🔴 **MISSING** — Environment variable `ANDROID_HOME` is not configured and no Android SDK directory was detected at standard Windows locations.
- **sdkmanager**: 🔴 **MISSING** — Command-line tools not found on PATH.
- **Gradle**: 🔴 **MISSING** — Gradle is not installed globally or present as a wrapper in the root.

### Section 8 Problem Diagnosis & Server Fixes
- **Error Loading Data**: 🟢 **RESOLVED** — Timeout increased to 12s on mobile client with embedded local fallback; missing Korean cuisine added; alias normalization added; error schema standardized with `SERVER_WAKING`, `UPSTREAM_QUOTA`, etc.
- **Incorrect Restaurant Prices**: 🟢 **RESOLVED** — Single source of truth with 33 verified restaurants in BDT (৳); `ui.js` modal bug resolved; budget chips (৳ to ৳৳৳৳), dual sliders, and numeric inputs bidirectionally synced; itemized meal estimator implemented.
- **Test Suite Status**: 🟢 **159 / 159 PASS** across 25 Vitest files; 9/9 Python analytics PASS; 12/12 Java dispatch PASS.
- **Documentation**: `docs/PROBLEMS.md` and `docs/DECISIONS.md` updated.
