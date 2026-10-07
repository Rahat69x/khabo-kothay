# Architecture & Engineering Decisions (ADR)

## Phase P1 Decisions: Reliability, Cost Control and Operations

### 1. Coarse Spatial Grid for Candidate Caching (~300 meters)
- **Decision**: Round GPS coordinates to a ~300m grid cell (`0.0027°` latitude and `0.0029°` longitude in Dhaka) when checking the candidate cache.
- **Rationale**: Diners searching from nearby spots (e.g. across the street, a block away in Gulshan-1, or around Notun Bazar) are searching within the exact same radius. Caching by coarse grid reduces redundant Google Places text search API calls by up to 75%.
- **TTL**: 10 minutes (`600s`).

### 2. Stale-While-Revalidate (SWR) with 5-Minute Grace Window
- **Decision**: When a cache entry is expired but within the 5-minute grace window, immediately serve the cached result and trigger background asynchronous revalidation.
- **Rationale**: Mobile network latencies in Dhaka can vary wildly. SWR ensures mobile clients receive near-instantaneous recommendations (<50ms) without waiting for network hops, while keeping data fresh.

### 3. Dual-Layer Cache Architecture (Memory + Optional Upstash Redis)
- **Decision**: Keep a synchronous high-speed in-memory LRU/TTL store as primary, with optional asynchronous fire-and-forget sync to Upstash Redis via REST API when configured.
- **Rationale**: Standard Node.js async Redis calls can introduce latency spikes or crashing hazards if the Redis server goes down. The hybrid adapter ensures synchronous in-memory hits, and if Redis is unreachable, seamlessly continues operations without user-facing impact.

### 4. Lazy Place Details Loading
- **Decision**: Candidate searches (`/recommend` and `/restaurants/search`) only request basic place information (id, name, location, rating, price level, photos). Detailed fields (phone numbers, full weekly opening hours, website) are queried only when `/api/v1/places/:id/details` is explicitly invoked by opening a restaurant modal.
- **Rationale**: Directly halves Google Maps Platform API SKU costs.

### 5. Multi-Tiered Cost Control: Device Daily Limits & Global Monthly Kill-Switch
- **Decision**: Enforce a 50 search/day limit per device (`X-Device-Id` or IP). Enforce a 10,000 monthly request budget. When the monthly budget is exceeded or kill-switch is flipped, the engine never throws HTTP 500; instead, it returns cached/mock candidates marked with `isBudgetFallback: true` and a polite transparent message.
- **Rationale**: Protects operators against unexpected cloud billing spikes while maintaining an uninterrupted user experience.

### 6. Backward-Compatible API Versioning (`/api/v1` and `/api`)
- **Decision**: Implement `/api/v1` as the canonical versioned root documented in [docs/openapi.yaml](file:///docs/openapi.yaml), while mounting `/api` as a transparent alias.
- **Rationale**: Guarantees existing mobile APKs, web clients, and prior test suites continue running without regressions.

### 7. Structured Logging with Strict PII Redaction (pino)
- **Decision**: Use `pino` with request IDs (`X-Request-Id`). Redact auth tokens, cookies, phone numbers, and coarse-grain GPS coordinates.
- **Rationale**: Complies with GDPR/privacy principles and ensures no identifiable user coordinates are stored in server logs.

### 8. EAS Update Channel Segmentation
- **Decision**: Map EAS build profiles to dedicated channels: `development`, `preview`, and `production`.
- **Rationale**: Enables over-the-air hotfixes for JavaScript bundle updates without requiring users to download and reinstall new standalone `.apk` files.

## Phase P2 Decisions: Smarter Decisions (Recommendation Intelligence)

### 9. Departure Time Predictions & Diurnal Traffic Curve Fallback
- **Decision**: Request future predicted traffic with Routes API `departureTime` at +0, +15, +30, and +60 minutes for the top 3 picks. If Google API is unreachable, quota-throttled, or in mock mode, gracefully fall back to a modeled Dhaka diurnal traffic congestion curve based on rush hours (08:30-10:30 and 16:30-20:30).
- **Labeling Rule**: Every prediction item and suggestion MUST be explicitly labeled `predicted` (`isPrediction: true`) to comply with truth-in-data principles.

### 10. Time-Budget Mode ("I have 45 minutes")
- **Decision**: Model total time needed as `2 * oneWayTravelTimeMinutes` (round-trip travel) plus a configurable `diningDurationMinutes` mapped by cuisine in `server/config/context.json` (e.g., Coffee: 15m, Fast food: 20m, Bangladeshi/Biriyani: 30-35m, Fine dining: 60m).
- **Enforcement**: Drops candidates whose total round-trip + dining time exceeds user's budget. Furthermore, drops candidates that close before estimated arrival + dining duration.

### 11. Bounded Multi-Armed Bandit with Simplex Projection
- **Decision**: Use an epsilon-greedy bandit algorithm to personalize factor weights (`time`, `cost`, `rating`, `distance`, `price`, `traffic`, `taste`) based on implicit choice signals (opens, directions, ratings).
- **Guardrails**:
  - Strict lower bound: `0.05` (5%).
  - Strict upper bound: `0.50` (50%).
  - Weights are projected onto the probability simplex so that $\sum w_i = 1.0$.
  - Slow learning rate: $\eta = 0.05$.
  - Provide an on/off toggle and a reset button that restores default baseline weights.
  - Explain personalization in plain language (e.g. "You often pick faster places, so speed counts a bit more for you now.").

### 12. Strict Unverified Dietary Preferences & Allergen Disclaimer
- **Decision**: Filter candidates by Halal, Vegetarian, No Beef, and Spice Level using cuisine baseline characteristics in `server/config/preferences.json`.
- **Safety Directive**: Google Places data for dietary attributes is unreliable. All returned preference matches are labeled `unverified`.
- **Allergen Notice**: The app MUST NEVER claim allergen safety anywhere. Responses and UI include: *"Dietary and spice preferences are unverified and estimated. Never rely on this for allergen safety."*

### 13. Counterfactual Trade-off Explanations
- **Decision**: Compute what candidate would have won under an alternative priority (Cheapest or Fastest) and compare against the active top pick.
- **Format**: Show concise counterfactual trade-offs: *"If you chose Cheapest: B saves ৳40 but adds 12 min."*

### 14. Anonymized Evaluation Harness & Replay Framework
- **Decision**: Implement an opt-in evaluation logger that stores impressions, opens, and directions in `server/data/eval-sessions.jsonl` without PII. Provide `scripts/eval.js` to compute top-1 and top-3 hit rates and Mean Reciprocal Rank (MRR) across weight configurations, with an A/B testing flag.

### 15. Progressive Web App (PWA) vs Native Android App Trade-offs
- **Decision**: Deliver an installable PWA for initial testing on Android phones via Chrome before shipping the standalone APK.
- **Capabilities Delivered by PWA**:
  - Instant installation from Google Chrome without Play Store dependencies.
  - Offline app shell caching via Service Worker (`public/sw.js`).
  - Standalone fullscreen display (`display: standalone`) with matching theme colors.
  - Fast updates upon page reload via `skipWaiting`.
- **What a PWA Cannot Do (Postponed for Native App)**:
  - Native push notification channels and alarms when the browser process is inactive.
  - Android home screen dynamic app shortcuts and app icon notification badges.
  - Background geofencing and continuous background GPS tracking.
  - Android 13+ Material You system-themed monochrome launcher icons (requires native Android XML adaptive icon configuration).
  - Hardware-level haptic engine integration and Play Integrity device attestation.

### 16. Dhaka Location Database Geographic Scope and Modeling Decisions
- **Decision**: Define geographic coverage using two nested levels:
  - **Level 1 (Core Dhaka)**: Dhaka North City Corporation (DNCC, 54 wards) and Dhaka South City Corporation (DSCC, 75 wards).
  - **Level 2 (Greater Dhaka / Metropolitan Planning Area)**: RAJUK Detailed Area Plan (DAP) coverage area (~1,528 km²). Includes Savar Upazila urban/industrial clusters (Savar town, Ashulia, Birulia, Aminbazar, Hemayetpur), Keraniganj Upazila urban fringe (Hasnabad, Zinjira, Tegharia, Jhilmil, Aganagar), Tongi and Gazipur urban corridor (GCC wards 43–57, Board Bazar, Gazipur Chowrasta), and Narayanganj urban corridor (NCC, Fatullah, Siddhirganj, Chashara, Kanchpur).
- **Exclusion Boundary**: Outlying rural upazilas of Gazipur (Kaliakair, Kapasia, Sreepur, Kaliganj), Narayanganj (Araihazar, Sonargaon, Rupganj outer rural tracts), Munshiganj, and Manikganj are excluded from metropolitan dining search to prevent irrelevant remote matches.
- **Hierarchy Distinction**: Administrative hierarchy (Division → District → City Corporation → Ward / Thana) is strictly decoupled from local geographic perception and common address usage (Broad Area → Sub-area → Sector / Block / Road / Landmark). Wards do not strictly equal neighborhoods, and police stations do not define dining zones.
- **Subdivision Policy**: Verified subdivisions (e.g. Uttara Sectors 1-18, Mirpur 1-14, Gulshan 1-2, Badda zones, Old Dhaka mohallas) are indexed with distinct geographic centers and bounding features while preserving parent area relationships.
- **Safety and Anti-Fabrication**: Any unverified administrative or coordinate details are flagged as UNCERTAIN or approximate local boundaries based on physical geography (rivers, rail tracks, canals, arterial roads). Center coordinates do not represent polygon boundaries.
