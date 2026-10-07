# Khabo Kothay? Project Progress Tracker

## Status Overview
- **Current Phase Completed**: **P2 - Smarter Decisions (MUST)** ✅
- **Test Pass Rate**: 🟢 **81 / 81 Tests Passing (100%) across 15 test suites**
- **Engine Code Coverage**: **> 92%**
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
