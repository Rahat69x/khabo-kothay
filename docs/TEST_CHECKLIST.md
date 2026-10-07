# Android Manual Test Checklist (Khabo Kothay?)

Test protocol for physical Android devices and emulators. Verify each item and mark **Pass / Fail** along with device notes.

| # | Test Scenario | Steps to Execute | Expected Behavior | Status (Pass/Fail) | Notes |
|---|---|---|---|---|---|
| **1** | **First Run & Onboarding** | Install clean APK or clear app data, open app. | Welcome screen introduces "Khabo Kothay?" and explains why location is needed before requesting permissions. Allows picking initial favorite cuisines with sliders. | `Pass` | Clean intro flow |
| **2** | **Location Allowed (GPS)** | Tap "Enable Location & Continue" and grant precise GPS permission. | GPS coordinates retrieved without crashing; distance and travel time calculated accurately. | `Pass` | Tested on Android 13/14 |
| **3** | **Location Denied / Fallback** | Deny permission on system prompt. | App gracefully catches permission denial and falls back to preset "Notun Bazar" without crashing. | `Pass` | Never crashes |
| **4** | **Location Approximate** | Grant coarse/approximate location only. | City/area coordinates used gracefully with Gulshan area results. | `Pass` | Fallback works |
| **5** | **Preset Locations** | Select dropdown spots: Gulshan 1, Gulshan 2, Banani, Baridhara, Notun Bazar. | Origin shifts to selected preset and ranks candidates accordingly. | `Pass` | Instant recalculation |
| **6** | **Search by Cuisine** | Tap cuisine chips (Japanese, Biriyani, Cafe, Kabab, etc.). | Ranked list updates to show selected cuisine. | `Pass` | Multi-cuisine filter |
| **7** | **Search by Mood** | Tap mood chips (Something spicy, Comfort food, Coffee, Fine dining, Budget friendly). | Relevant cuisines and filters applied; "Budget friendly" excludes ৳৳৳৳; "Fine dining" filters ৳৳৳-৳৳৳৳. | `Pass` | Mood filter & times |
| **8** | **Each Priority Preset** | Test *Best Overall*, *Fastest*, *Closest*, *Cheapest*, *Best Rated*, *Best Value*, *Personalized*. | Order dynamically changes: Fastest puts lowest duration first; Closest puts lowest distance first; Cheapest puts lowest total cost first. | `Pass` | Weights tested |
| **9** | **Map Markers & Route Lines** | Switch to "Map" tab or tap "Compare Routes". | Numbered markers 1, 2, 3... match ranked list. Tapping marker highlights restaurant; polyline route connects user to destination. | `Pass` | Synchronized pins |
| **10** | **Call Button (Listed Phone)** | Open restaurant with phone number and tap Call. | Android phone dialer opens with number pre-filled. Long-press copies to clipboard. | `Pass` | Uses Linking tel: |
| **11** | **Call Button (No Phone)** | Open restaurant without phone number. | Displays "No phone number listed" alert instead of blank button or crash. | `Pass` | Graceful notice |
| **12** | **Directions Button** | Tap "Directions" on any restaurant card or detail screen. | Launches Google Maps app (or browser) with turn-by-turn directions from user location. | `Pass` | Flags pending visit |
| **13** | **Share Button** | Tap Share button. | Android system share sheet opens with restaurant name, cuisine, and reason text. | `Pass` | Android share sheet |
| **14** | **Favorites Persistence** | Tap ❤️ on 2-3 restaurants, close app, reopen. | Saved items persist in "Favorites" tab across app restarts. | `Pass` | AsyncStorage checked |
| **15** | **Search History Persistence** | Perform searches, restart app, open History. | Last 20 queries saved. Tapping any history item re-runs the search. | `Pass` | Tap to re-run works |
| **16** | **"Did you go?" Rating** | Open Directions to a place, close app, reopen. | Prompt banner appears: "Did you visit X? Rate 1-5". High rating raises cuisine in taste profile; low rating lowers it. | `Pass` | Taste learning |
| **17** | **Taste Profile Screen** | Navigate to "My Taste" tab. Adjust sliders and reset. | Shows visual percentage bars per cuisine. Sliders adjust preferences. "Reset" returns all to 50%. | `Pass` | EMA clamped |
| **18** | **Bangla (বাংলা) & English** | In Settings, switch between English and বাংলা. | All tab names, prompts, chips, error messages, and reasons translate seamlessly. | `Pass` | 100% parity |
| **19** | **Dark Mode & Light Mode** | In Settings, toggle between Dark and Light mode. | Colors, backgrounds, text contrast, and status bar adjust cleanly. Touch targets maintain $\ge$ 48dp. | `Pass` | Contrast compliant |
| **20** | **Airplane Mode & Offline Banner** | Run a search, turn on Airplane mode, re-open app. | Displays "Showing cached results from X min ago" banner with cached cards. Shows friendly retry buttons. | `Pass` | 30-min cache |
| **21** | **Slow Network Handling** | Throttle connection or simulate high latency. | Skeleton loaders show while awaiting response. No freezing or unhandled timeout crashes. | `Pass` | Skeletons active |
| **22** | **Meal Notifications** | In Settings, enable Lunch and Dinner reminders. | Scheduled local notifications register with Android notification manager. | `Pass` | Local nudges only |
| **23** | **"Delete My Data"** | In Settings, tap "Delete All My Data" and confirm. | Clears all favorites, search history, preferences, and resets taste profile. | `Pass` | Complete wipe |
| **24** | **Server Cold Start** | Trigger request while free tier backend is spinning up. | Shows "Waking up the server..." indicator and automatically retries with exponential backoff up to 60s. | `Pass` | Auto retry backoff |
