# Data Privacy Matrix (docs/PRIVACY_MATRIX.md)

This document maps all user data and feature attributes across **Khabo Kothay?**, defining storage location, logging policy, and transmission scope.

---

## Privacy Policy Principles
1. **Device-First for Sensitive Data**: Personal locations (Home, Office, University), spend histories, budget amounts, and accessibility requirements never leave the device.
2. **Derived & Boolean Flags Only**: When the server needs context (e.g. wheelchair accessibility or budget pressure), the app transmits only boolean flags or coarse derived indicators, never the underlying personal data.
3. **No Precise GPS Storage**: Server logs never record fine-grain GPS coordinates. Coarse caching grids (~300m) are used in memory without user tracking.
4. **No Mining of Review Text**: The app and server strictly avoid scraping, mining, or storing Google review text.

---

## Data Inventory & Transmission Matrix

| Data Item | Feature / Task | Storage Location | Server Logged? | Sent in API Request? | Sensitivity & Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Current GPS Coordinates** | Search & Recommend | Device (transient in memory) | **NO** (redacted) | YES (coarse / query) | Used only in foreground for distance and travel time. |
| **Saved Places (Home, Office, Uni)** | Navigation & Meal-Time | **Device Only** (Room) | **NO** | NO (only resolved area/coord sent) | Never synced to server. |
| **Accessibility Needs** (Wheelchair, etc.) | Task 6: Parking & Access | **Device Only** (Room / SharedPreferences) | **NO** | YES (boolean filter flags only: `wheelchairEntrance: true`) | Sensitive personal profile. Zero server logging. |
| **Spend History & Diary Entries** | Task 3: Budget Tracker | **Device Only** (Room `spend_entries`) | **NO** | **NO** | Stored strictly in local SQLite. |
| **Monthly Budget Total** | Task 3: Budget Tracker | **Device Only** (Room `budget_settings`) | **NO** | **NO** | User budget limit stays on device. |
| **Budget Context (`dailyAllowanceBdt`, `pressure`)** | Task 3: Budget Tracker | Device (computed) | **NO** | YES (derived score `0.0..1.0`) | Server adjusts price weights; never sees spend logs. |
| **Bill Splitter Calculations** | Task 1: Outing Cost | **Device Only** (Transient in memory) | **NO** | **NO** | Splitter operates 100% offline. |
| **Favorite Places (`placeId`)** | Core & Task 2: Closing Alerts | Device (Room) / Server (status check) | **NO** (no user ID linked) | YES (`placeIds[]` max 20) | Sent anonymously to check opening status only. |
| **Closing Alert Preferences** | Task 2: Closing Alerts | **Device Only** (Room `favorite_alert`) | **NO** | **NO** | WorkManager evaluates alerts locally on device. |
| **Want-to-Try Bookmarks & Notes** | Task 10: Want to Try | **Device Only** (Room `want_to_try`) | **NO** | **NO** | Stored strictly in local SQLite. |
| **Geofence Definitions (Saved Coordinates)** | Task 10: Geofence Reminders | **Device Only** (Android GeofencingClient) | **NO** | **NO** | Geofences evaluated locally by OS; no location uplink. |
| **Widget Config & Last Area** | Task 5: Home Widget | **Device Only** (AppWidget SharedPreferences) | **NO** | YES (anonymous `areaId` or `lat,lng`) | Foreground update only. No background location. |
| **Community Gem Submissions** | Task 7: Hidden Gems | Both (Room queue + Server PostgreSQL) | Standard audit log | YES (bilingual name, coords, category) | Device ID is hashed with secret salt; raw ID never stored. |
| **Gem Confirmation / Report** | Task 7: Hidden Gems | Server PostgreSQL | Standard audit log | YES (`deviceHash`, `gemId`, `reason`) | Anonymously hashed; used for UGC moderation. |
| **Saved Seasonal Guides** | Task 8: Seasonal Guides | **Device Only** (Room `saved_guide`) | **NO** | **NO** | Local bookmarking. |
| **Dish Search Queries & Spelling** | Task 9: Dish-First Search | Device (local cache) / Server (suggest) | Anonymous metrics only | YES (`dishId` or `q`) | No personal identifier attached. |
| **Taste Profile (Learned Weights)** | Core: Personalization | Device (Room) / Server (sync opt-in) | **NO** | YES (factor weights array) | Bounded simplex weights only. Resettable anytime. |
| **Feedback & Ratings** | Core: Feedback | Server | Anonymous aggregations | YES (`placeId`, `rating`, `reasons`) | No user profile attached. |

---

## Compliance & Privacy Verification
- **Google Play Data Safety**: Conforms to self-declared zero-collection of sensitive location history, zero sharing with third parties, and full offline autonomy for financial/budget tracking.
- **Data Export & Deletion**: Settings $ightarrow$ Diagnostics provides complete local data wipe (`AppDatabase.clearAllTables()`) and local JSON/CSV export.
