# Known Problems, Root Causes & Fixes (docs/PROBLEMS.md)

This document records the diagnosis, reproduction, root causes, and verified fixes for the critical problems outlined in Section 8 of the Android Blueprint v3.

---

## 1. Problem: "Error Loading Data" (API Errors, 404s, Backend Failures & Server Wake-up Delays)

### Symptoms
- Initial load hangs or displays indefinite spinners.
- Empty restaurant lists when selecting certain cuisines (e.g., "Korean").
- Cold-start cloud server wake-ups (taking 6-10s on free tiers) triggering premature network abortion on mobile clients.
- Map and recommendation data failing silently without meaningful error codes.

### Root Causes
1. **Aggressive Mobile Timeout**: `mobile/src/api/client.js` had a 4.5s timeout. Cold starts take >5s, latching client into offline state.
2. **Missing Cuisines & Strict String Matching**: Korean cuisine had zero entries in dataset; mock engine had strict string comparisons.
3. **Unprotected Map Initialization**: Leaflet map initialization unhandled errors blocked search execution.
4. **Non-Standardized Error Responses**: Errors lacked structured codes, hints, and request IDs.

### Applied Fixes
- In `mobile/src/api/client.js`, timeout increased to 12s with fallback to verified embedded dataset.
- Added verified Korean restaurants (Arirang, Dae Jang Geum), Indian (Sajna), Cafe (North End), Bengali (Kasturi), Chinese (Mainland China), bringing total to 33 verified spots.
- Normalized cuisine matching with aliases in mock engine.
- Structured errors to `{error: {code, message, hint, requestId}}`.
- Health endpoint (`/api/health` and `/api/v1/health`) verified.

---

## 2. Problem: "Incorrect Restaurant Prices" (Mismatched Prices, Filter Inconsistency & Hidden Charges)

### Symptoms
- Modal displayed "Not available" for menu item prices.
- Disconnect between budget tiers, dual range sliders, and numeric inputs.
- Meal estimator lacked real menu item selection.

### Root Causes
1. **Property Name Mismatch**: `ui.js` checked `item.priceBdt`, while database had `item.price`.
2. **Field Stripping**: `getPlaceDetails()` in `places.js` stripped cost, range, and verification fields.
3. **Desynchronized Filters**: Budget chips and sliders had conflicting listeners.

### Applied Fixes
- Standardized all 33 restaurants with real BDT (৳) prices, per-person estimates, ranges, derivations, sources, and dates.
- Fixed `ui.js` price fallback: `item.priceBdt ?? item.price`.
- Synchronized budget chips (৳: 0-400, ৳৳: 400-950, ৳৳৳: 950-2000, ৳৳৳৳: 2000-5000) with dual sliders and numeric inputs.
- Upgraded Meal Cost Estimator with itemized dish checklists, 15% VAT, and 10% Service Charge calculations.

---

## 3. Problem: GPS and Permissions Handling
- Implemented runtime permission rationale, handling COARSE, FINE, and permanently denied states with fallback to Area Picker.

---

## 4. Problem: Phone Cannot Reach Server & APK Stability
- Release builds target HTTPS endpoint.
- R8 keep rules preserved for models.
