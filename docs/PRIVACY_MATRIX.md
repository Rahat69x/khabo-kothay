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

---

## 15 Features (F1–F15) Privacy & Data Transmission Matrix

| Feature ID | Feature Name | Storage Location | Server Logged? | Sent to Network? | Privacy Guarantees |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **F1** | **Update Checker & What's New** | Device (cache) & Server | Anonymous request metrics | YES (`versionCode`, `channel`) | External browser download intent only. NO `REQUEST_INSTALL_PACKAGES` permission. |
| **F2** | **Fare Check** | Server (crowdsourced reports) | Moderation log | YES (`origin`, `destination`, `mode`, `fareBdt`) | No personal or driver details ever collected. Labeled "estimated reference range". |
| **F3** | **Ask In Your Own Words** | Device & Server (parser) | Anonymous query only | YES (`query` string) | Voice recognized locally via OS; transcript editable by user before network query. |
| **F4** | **Group Mode** | Server (3h session) | Temporary session cache | YES (`areaName`, `dietaryTags`, `budget`) | Unguessable 128-bit token. Exact coordinates never shared; areas only. Auto-expires in 3h. |
| **F5** | **Swipe Mode** | **Device Only** (SharedPreferences) | **NO** | **NO** | Taste affinities computed locally. Feeds ranking as soft signal only. |
| **F6** | **Dish Prices** | Server (community reports) | UGC Moderation log | YES (`restaurantId`, `dishName`, `priceBdt`) | Integer minor units (BDT). No receipt/bill photos containing user names or payment details. |
| **F7** | **Rain-Aware Mode** | Device & Server (Open-Meteo cache) | **NO** | YES (coarse lat/lng) | Ephemeral weather check (15m TTL). No location history. |
| **F8** | **Dietary Preferences** | **Device Only** (SharedPreferences) | **NO** | YES (optional search filter) | Personal dietary tags stay on device. Zero server profiling or logging. |
| **F9** | **Lunch-Break Reminder** | **Device Only** (WorkManager / Room) | **NO** | **NO** (local worker) | Evaluated locally using saved office location. NO runtime background GPS. |
| **F10** | **Share My Trip** | Device (native share intent) | **NO** | **NO** (client-side intent) | Public Google Maps directions URL built for destination only. Zero sender location leaks. |
| **F11** | **Pay-Me Line in Bill Split** | **Device Only** (Encrypted Storage) | **NO** | **NEVER** (0% network transfer) | Stored exclusively on device in private SharedPreferences. Formatted locally for user review. |
| **F12** | **Simple Mode** | **Device Only** (SharedPreferences) | **NO** | **NO** | Local accessibility UI preference for contrast and typography scaling. |
| **F13** | **Food Story** | **Device Only** (Room DB) | **NO** | **NO** (native share preview) | 100% computed on device. Strips private home/work places before user previews share card. |
| **F14** | **Remote Feature Flags** | Device (cache) & Server | Anonymous request metrics | YES (`installId`, `versionCode`, `channel`) | Install ID is a random UUID reset on reinstall; used only for stable 0-99 hash assignment. |
| **F15** | **Opt-In Crash Reports & Report a Problem** | Device (cache) & Server | Redacted diagnostic queue | YES (only upon explicit opt-in) | Redacts all API keys (`AIza...`), auth tokens, phone numbers, emails, and coordinates. |
