# Icon & Navigation Audit — Khabo Kothay?
# Date: 2026-10-12
# Scope: Fix 1 (Confusing Icons: Clean Bottom Bar and Menu)

## 1. Executive Summary
This audit lists every icon-only control and navigation element across all top-level and detail screens in Khabo Kothay?. On mobile phones without hover tooltips, icon-only buttons create confusion and accessibility failures. Fix 1 establishes an unmistakable hierarchy:
- A Material 3 Bottom Navigation Bar with at most 5 labeled destinations (Home, Meal-Time, Search, Saved, Me) with `labelVisibilityMode="labeled"`.
- A hamburger navigation drawer for secondary tools and management screens.
- Explicit text labels on high-frequency actions (Call, Directions).
- Bilingual accessibility content descriptions (`contentDescription` in EN and BN) and dynamic state descriptions (`ViewCompat.setStateDescription`) for all toggle controls.

---

## 2. Inventory of Icon-Only and Navigation Controls

| Screen | Control / Element | Current Icon / Glyph | Current Label / Tooltip | Target Design (Fix 1) | Accessibility Label (EN) | Accessibility Label (BN) | State Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Global Shell** | Bottom Nav Item 1 | 🏠 (ic_home) | "Home" | Icon + Visible text "Home" | "Home, Eat now" | "হোম, এখনই খাবো" | N/A |
| **Global Shell** | Bottom Nav Item 2 | ⏱️ (ic_mealtime) | None / Hidden | Icon + Visible text "Meal-Time" | "Meal-Time mode" | "খাওয়ার সময় মোড" | N/A |
| **Global Shell** | Bottom Nav Item 3 | 🔍 (ic_search) | None | Icon + Visible text "Search" | "Search dishes and areas" | "খাবার ও এলাকা খুঁজুন" | N/A |
| **Global Shell** | Bottom Nav Item 4 | ❤️ / 🔖 (ic_saved) | "Favorites" | Icon + Visible text "Saved" (Tabs: Favorites, Want to Try) | "Saved places" | "সংরক্ষিত স্থান" | N/A |
| **Global Shell** | Bottom Nav Item 5 | 👤 (ic_me) | "Taste" / "Settings" | Icon + Visible text "Me" (Taste, History, Diary, Budget) | "My profile and history" | "আমার প্রোফাইল ও ইতিহাস" | N/A |
| **Top-Level Header** | Drawer toggle | ☰ (ic_menu) | None | Hamburger button with 48dp touch target | "Open navigation menu" | "মেনু খুলুন" | N/A |
| **Detail Header** | Back button | ← (ic_arrow_back) | None | Standard Android back button | "Navigate back" | "ফিরে যান" | N/A |
| **Home / Results** | GPS Locate | 🎯 (ic_my_location) | Icon-only | Icon + text "GPS" / 48dp icon button with contentDescription | "Use current GPS location" | "বর্তমান জিপিএস লোকেশন ব্যবহার করুন" | N/A |
| **Home / Results** | Filter button | 🌪️ (ic_filter) | Icon-only | Filter button with badge and text label where space allows | "Filter restaurants" | "ফিল্টার করুন" | N/A |
| **Home / Results** | Map / List toggle | 🗺️ / 📋 (ic_map_toggle) | Icon-only | Icon + visible label ("Map" / "List") | "Switch to map view" / "Switch to list view" | "ম্যাপ ভিউতে যান" / "লিস্ট ভিউতে যান" | "Viewing list" / "Viewing map" |
| **Home / Results** | Refresh / Re-roll | 🔄 (ic_refresh) | Icon-only | Icon + "Refresh" | "Refresh recommendations" | "নতুন করে খুঁজুন" | N/A |
| **Restaurant Card** | Favorite Toggle | ❤️ / 🤍 (ic_favorite) | Icon-only | 48dp toggle button with stateDescription | "Favorite" | "পছন্দের তালিকা" | "Saved to favorites" / "Not saved" ("সংরক্ষিত" / "সংরক্ষিত নয়") |
| **Restaurant Card** | Want to Try Toggle | 🔖 / 🏷️ (ic_bookmark) | Icon-only | 48dp toggle button with stateDescription | "Want to try" | "যেতে চাই" | "Marked as want to try" / "Not marked" ("যেতে চাই তালিকায় যুক্ত" / "যুক্ত নয়") |
| **Restaurant Card** | Closing Alert Bell | 🔔 / 🔕 (ic_notifications) | Icon-only | 48dp toggle button with stateDescription | "Closing alert" | "বন্ধের সতর্কবার্তা" | "Alert active" / "Alert off" ("অ্যালার্ট চালু" / "অ্যালার্ট বন্ধ") |
| **Restaurant Card** | Explain Pick | ❓ (ic_help_outline) | Icon-only | Icon + text "Why this?" / 48dp button | "Why was this recommended?" | "কেন এই রেস্তোরাঁ সুপারিশ করা হলো?" | N/A |
| **Restaurant Detail** | Call action | 📞 (ic_call) | Icon-only | Combined Icon + Text "Call" ("কল করুন") | "Call restaurant" | "রেস্তোরাঁয় ফোন করুন" | N/A |
| **Restaurant Detail** | Directions action | ↗️ (ic_directions) | Icon-only | Combined Icon + Text "Directions" ("দিকনির্দেশনা") | "Get directions" | "দিকনির্দেশনা পান" | N/A |
| **Restaurant Detail** | Share action | 🔗 (ic_share) | Icon-only | 48dp icon button with label | "Share restaurant details" | "শেয়ার করুন" | N/A |
| **Search Screen** | Clear query | ✕ (ic_clear) | Icon-only | 48dp button with contentDescription | "Clear search text" | "লেখা মুছে ফেলুন" | N/A |

---

## 3. Navigation Hierarchy & Information Architecture

### A. Bottom Navigation Bar (5 Labeled Destinations at Most)
1. **Home**: Destination `navigation_home`
   - Hero search card, Area chip selector, Mood switcher.
   - Prominent, primary "Eat now" (এখনই খাবো) action button.
   - Quick-access to top traffic-aware recommendations.
2. **Meal-Time**: Destination `navigation_mealtime`
   - Time-budget dial / chips (15, 30, 45, 60, 90 mins).
   - Mode selectors: Breakfast, Lunch, Evening Snacks, Dinner.
   - Feasible routes with outbound/return traffic buffers.
3. **Search**: Destination `navigation_search`
   - Unified text search for dishes (Biriyani, Tehari, Cha) and Dhaka areas (Gulshan, Banani, Baridhara).
   - Price range, dietary filter sheets, and Map/List switcher.
4. **Saved**: Destination `navigation_saved`
   - Tab 1: **Favorites** (❤️) with closing alert toggles.
   - Tab 2: **Want to Try** (🔖) with geographic proximity alerts.
5. **Me**: Destination `navigation_me`
   - **My Taste**: AI taste weights and cuisine preference sliders.
   - **History**: Past dining decisions and feedback logs.
   - **Food Diary & Budget**: Monthly spend entries and budget limits.

### B. Hamburger Navigation Drawer (Top-Left of Top-Level Screens)
Opened via `ic_menu` hamburger icon button with TalkBack label "Open navigation menu":
1. **Seasonal Guides** (ic_local_dining) — Curated Ramadan/Iftar, Winter Pitha, and Adda guides.
2. **Add a Place / Suggest Spot** (ic_add_location) — Community recommendations and hidden gems.
3. **Bill Splitter** (ic_calculate) — Multi-person tax, tip, and transit cost calculator.
4. **Notifications & Alerts** (ic_notifications_active) — Closing alert schedule and budget alert thresholds.
5. **Settings** (ic_settings) — Language (EN / BN), Theme (System / Light / Dark), Data management.
6. **Help & Diagnostics** (ic_help) — Connection health, GPS status, and offline cache diagnostics.
7. **About** (ic_info) — Version info, privacy policy, and open-source licenses.

### C. Detail Screens
- Replace hamburger menu with an explicit back arrow (ic_arrow_back) labeled "Navigate back" ("ফিরে যান").

---

## 4. Typography & Large Font (200%) Verification Plan
- English and Bangla strings must be concise to avoid multi-line label wrapping at 200% font scaling:
  - Bottom Tab 1: "Home" / "হোম"
  - Bottom Tab 2: "Meal-Time" / "খাওয়ার সময়"
  - Bottom Tab 3: "Search" / "অনুসন্ধান"
  - Bottom Tab 4: "Saved" / "সংরক্ষিত"
  - Bottom Tab 5: "Me" / "আমার তথ্য"
- All touch targets strictly enforce Material 3 min size of 48dp x 48dp.
