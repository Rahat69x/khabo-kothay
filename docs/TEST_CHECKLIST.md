# Android & Device Quality Checklist (Khabo Kothay?)

Test protocol for physical Android devices, emulators, and browsers. Covers the new **Indigo and Saffron** brand theme in both Light and Dark modes.

---

## 🎨 Theme & Brand Verification Matrix (Light & Dark Mode)

| # | Theme Scenario | Steps to Execute | Expected Behavior (Light / Dark) | Status | Notes |
|---|---|---|---|---|---|
| **T1** | **Theme Switcher in Settings** | Open Settings → Select *System Default*, *Light Mode*, *Dark Mode*. | App changes theme instantly with zero lag. Status bar and Android navigation bar update immediately (dark icons on light, light icons on dark). No app restart required. | `Pass` | Tested on Android 13/14 |
| **T2** | **System Default Tracking** | Set app theme to *System Default*, then toggle system dark theme in Android quick settings. | App reacts in real-time to Android system appearance change. Web responds to `prefers-color-scheme`. | `Pass` | Zero FOUC / flash |
| **T3** | **Home Screen (Both Themes)** | Open Home screen in Light and Dark mode. | Background: `#F6F6FB` (Light) / `#11122B` (Dark). Surface cards: `#FFFFFF` / `#1B1D45`. Headings in Plus Jakarta Sans Bold (`#16183A` / `#ECECFA`). Chips with indigo active states. | `Pass` | Verified tokens |
| **T4** | **Results Screen (Both Themes)** | Run search and view ranked cards. | Rank numbers in brand indigo (`#3B3FA8` / `#8B90F0`). Card background matches surface token with subtle line borders. Score badges in `primaryTint`. | `Pass` | 4.5:1 text contrast |
| **T5** | **Badges Palette Rules** | Check each badge type across recommendations: | • **Best overall**: Saffron fill (`#FFB020`) with dark onAccent text (`#3D2800`).<br>• **Fastest to reach / Best for price**: `primaryTint` fill with `primary` text.<br>• **Try something new**: Transparent fill, `accentStrong` border and text (`#8A5200` light / `#FFB020` dark).<br>• **Community-verified**: `successTint` fill with `success` text. | `Pass` | Saffron never used for body text |
| **T6** | **Traffic Status Chips** | View Low, Moderate, and Heavy traffic chips on both themes. | • **Low**: Green (`#197847` on `#E3F4EA` light; `#5FD08D` on `#12372A` dark) with `🟢` icon + label.<br>• **Moderate**: Amber/warning with `🟡` icon + label.<br>• **Heavy**: Coral/danger with `🔴` icon + label.<br>*Color is never the only signal; Saffron is never used for traffic.* | `Pass` | Double signal (icon+label) |
| **T7** | **Recommendation Factor Bars (Bottom Sheet / Drawer)** | Tap "Why was this picked?" on any restaurant card. | Sheet slides up smoothly. Breakdown bars render with `primary` fill on `primaryTint` track. Zero rainbow/unbranded colors. | `Pass` | Primary on tint track |
| **T8** | **Interactive Area Map (Light & Dark)** | View Map tab or Compare Routes in both modes. | • **Light**: Default Google Map styling; user location dot is indigo with white ring; pins are indigo with white numbers; selected pin is saffron.<br>• **Dark**: Custom `map-style-dark.json` applied (dark roads, labels, and water); pins maintain $\ge$ 3:1 contrast against dark tiles. | `Pass` | Styles loaded from JSON |
| **T9** | **Route Polyline Rendering** | Select a restaurant to preview route from user location. | Recommended route renders as thick primary indigo line; alternative routes render thinner in muted tone (`#5E6088` / `#A3A6D6`). | `Pass` | Primary vs Muted |
| **T10** | **Keyboard & Input Fields** | Tap search, cuisine inputs, or review dialogs. | Focus ring in `focusRing` token (`#3B3FA8` light / `#B6B9FF` dark). Keyboard opens without white flash or clipping background. | `Pass` | SoftInputMode handled |
| **T11** | **Modal & Dialog Backdrop Scrim** | Open Taste Profile, Favorites, or History modals. | Backdrop scrim renders `rgba(17,18,43,0.5)` (light) / `rgba(0,0,0,0.6)` (dark). Modal surface matches theme tokens. | `Pass` | Zero white leaks |
| **T12** | **App Icon & Android Adaptive Icons** | Inspect app icon on home screen launcher. | 1024x1024 adaptive icon with solid indigo background (`#3B3FA8`), white '?' with saffron pin drop dot centered in the safe zone. | `Pass` | Android adaptive icon |
| **T13** | **Android 13+ Themed Monochrome Icon** | Turn on "Themed Icons" in Android device settings. | Launcher displays clean white-on-transparent monochrome silhouette matching system accent colors. | `Pass` | monochromeImage wired |
| **T14** | **Splash Screen (Light & Dark)** | Force-close and launch app in both system modes. | • **Light**: Solid brand indigo background with white wordmark & saffron '?'.<br>• **Dark**: Dark `#11122B` background with wordmark. Zero white screen flash before first paint. | `Pass` | expo-splash dark mode |
| **T15** | **Push & Local Notifications** | Trigger meal reminder notification. | Notification banner displays white monochrome icon (`notification-icon.png`) with brand indigo accent color (`#3B3FA8`). | `Pass` | Android notification channel |
| **T16** | **Device Orientation / Rotation** | Rotate phone from Portrait to Landscape on Home, Results, and Map. | App adjusts layout seamlessly; no background color flashes or reset of theme choice. | `Pass` | Layout responsive |

---

## 📱 Feature & Functional Test Matrix

| # | Test Scenario | Steps to Execute | Expected Behavior | Status |
|---|---|---|---|---|
| **1** | **First Run & Onboarding** | Clean install, open app. | Welcome screen introduces "Khabo Kothay?" in brand typography. Allows picking initial preferences. | `Pass` |
| **2** | **Location Allowed (GPS)** | Tap "Enable Location & Continue" and grant GPS. | Coordinates retrieved; traffic travel times and distances computed accurately. | `Pass` |
| **3** | **Location Denied / Fallback** | Deny GPS permission. | App catches denial gracefully and defaults to preset "Notun Bazar" without crashing. | `Pass` |
| **4** | **Preset Locations** | Select Gulshan 1, Gulshan 2, Banani, Baridhara, Notun Bazar. | Origin shifts and recalculates distances and travel times instantly. | `Pass` |
| **5** | **Search by Cuisine** | Tap cuisine chips (Japanese, Biriyani, Cafe, Kabab, etc.). | Ranked list updates to show selected cuisine. Active chip highlights in indigo. | `Pass` |
| **6** | **Search by Mood** | Tap mood chips (Something spicy, Comfort food, Coffee, etc.). | Relevant cuisines, budget ceilings, and filters applied accurately. | `Pass` |
| **7** | **Each Priority Preset** | Test *Best Overall*, *Fastest*, *Closest*, *Cheapest*, *Best Rated*, *Best Value*, *Personalized*. | Order dynamically changes based on scoring weights (traffic travel time wins over closer distance in heavy traffic). | `Pass` |
| **8** | **Call & Directions Action** | Tap "Directions" or "Call" on detail screen. | Directions launches Google Maps turn-by-turn navigation; Call launches phone dialer. | `Pass` |
| **9** | **Favorites & History** | Save favorites and run queries; restart app. | Saved items and last 20 queries persist across app restarts in local storage. | `Pass` |
| **10** | **Bangla (বাংলা) & English** | In Settings, switch between English and বাংলা. | All tab names, prompts, chips, error messages, and reasons translate with correct Noto Sans Bengali font. | `Pass` |
| **11** | **Offline & Slow Network** | Simulate offline / high latency. | Skeleton loaders in brand `skeleton` color (`#E8E9F4` / `#232650`); cached banner displays gracefully. | `Pass` |
| **12** | **Delete My Data** | In Settings, tap "Delete All My Data" and confirm. | Clears all stored favorites, history, and resets taste profile. | `Pass` |
