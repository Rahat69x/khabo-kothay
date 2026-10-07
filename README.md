# Khabo Kothay? (খাবো কোথায়?) – Food Finder

A full-stack, traffic-aware dining recommendation engine and personal food assistant for Gulshan, Banani, Baridhara, and Notun Bazar in Dhaka, Bangladesh.

It answers one single question:
> **"Where should I actually go right now, and why?"**

Instead of just listing nearby spots by straight-line distance, it ranks candidates using real-time road congestion (Google Routes API), multi-modal transit fares (rickshaws, CNGs, ride-shares, walking), restaurant price tier, Bayesian review credibility, personal taste affinity, and time-of-day mood, providing a clear plain-language explanation for every recommendation.

---

## 🏆 Key Logic Handled

A restaurant **1.4 km away with heavy traffic (25 min)** loses to one **2.1 km away with light traffic (12 min)** when the user prioritizes **Fastest** or **Best Overall**.

```
Spot A: 2.4 km • 14 min • ৳৳ • 4.6★ (moderate traffic) ➔ 🌟 Wins Best Overall
Spot B: 1.6 km • 27 min • ৳৳ • 4.5★ (heavy traffic)    ➔ ❌ Loses Fastest
Spot C: 3.1 km • 16 min • ৳৳৳ • 4.7★ (low traffic)      ➔ ⭐ Wins Best Rated
```

---

## 🛠️ Technology Stack

- **Backend**: Node.js 18+, Express, ES modules, dotenv, helmet, cors, express-rate-limit.
- **Frontend (Web)**: HTML5, CSS3 (modern glassmorphism, mobile-first responsive), Vanilla JavaScript (ES modules, no framework).
- **Mobile (Android)**: React Native with Expo (SDK 52), React Navigation, react-native-maps, expo-location, expo-notifications, expo-localization, AsyncStorage.
- **APIs**:
  - Google Places API (New) – Text Search, Details, Photos proxy.
  - Google Routes API – `computeRouteMatrix` (traffic-aware duration & distance) & `computeRoutes` (alternative routes & polylines).
  - Open-Meteo – Weather context for Dhaka (monsoon/rain detection).
- **Testing**: Vitest (37 automated tests passing).
- **Storage**: Modular storage abstraction (`localStorage` for web, `AsyncStorage` for mobile).

---

## 🚀 Quick Start

### 1. Run in Mock Mode (No Google API Keys Needed)

The app comes configured out-of-the-box with `USE_MOCK_DATA=true` and a complete dataset of realistic fake restaurants in Gulshan, Banani, Baridhara, and Notun Bazar with varied ratings, prices, and traffic conditions.

```bash
# Install root dependencies
npm install

# Run the test suite (Vitest)
npm test

# Start the server
npm start
```

Open your browser at: **`http://localhost:3000`**

### 2. Run with Real Google Cloud Keys

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set the following environment variables:
   ```env
   PORT=3000
   USE_MOCK_DATA=false
   GOOGLE_SERVER_KEY=AIzaSy...YourServerKeyHere
   GOOGLE_BROWSER_KEY=AIzaSy...YourBrowserKeyHere
   APP_CLIENT_TOKEN=gulshan_app_secret_token_2026
   ```
3. Restart the server:
   ```bash
   npm start
   ```

---

## ☁️ Google Cloud Setup & Security Guide

### 1. Enable Required APIs in Google Cloud Console
- Go to [Google Cloud Console](https://console.cloud.google.com/).
- Create a new project (e.g. `gulshan-food-finder`).
- Enable the following APIs:
  - **Places API (New)**
  - **Routes API**
  - **Maps JavaScript API**
  - **Maps SDK for Android**

### 2. Set Up Billing & Budget Alerts
- Attach a billing account to your project.
- In **Billing** → **Budgets & alerts**, create an alert at $20 / $50 per month to prevent unexpected charges during high-volume testing.

### 3. API Key Restrictions & Isolation
- **Server Key (`GOOGLE_SERVER_KEY`)**:
  - Restrict by API: select **Places API (New)** and **Routes API**.
  - **Application restrictions**: select **IP addresses** (set to your server's IP address in production).
  - **Security Rule**: This key is used strictly on the server backend. It is **never sent to the browser or mobile app**.
- **Browser Key (`GOOGLE_BROWSER_KEY`)**:
  - Restrict by API: select **Maps JavaScript API**.
  - **Application restrictions**: select **HTTP referrers (websites)**.
  - Add your website domains: `https://your-domain.com/*`, `http://localhost:3000/*`.
- **Android Maps Key**:
  - Restrict by API: select **Maps SDK for Android**.
  - Restrict by application: select **Android apps** with your package name (`com.example.cafefinder`) and keystore SHA-1 fingerprint.

---

## 📝 Assumptions Made

1. **Transport Fares in Dhaka**:
   - Transport rates in [server/config/fares.json](file:///server/config/fares.json) are based on standard Dhaka local fare estimates:
     - Rickshaw: ৳20 base + ৳20/km.
     - CNG Auto-rickshaw: ৳40 base + ৳17/km.
     - Car / Ride-share (Uber/Pathao): ৳60 base + ৳25/km + ৳2/min with congestion multipliers.
   - **Important**: These fares are placeholders for guidance and must be checked and tuned against actual local street rates. All transport costs are explicitly labeled as *"estimated"* throughout the UI.
2. **Traffic Congestion Multipliers**:
   - Routes API duration-to-static-duration ratios: Low (< 1.15), Moderate (1.15 – 1.50), Heavy (> 1.50) based on Gulshan bottlenecks.
3. **Taste Profile & Privacy**:
   - No user tracking without login. All personal taste profile affinities, favorites, and search histories are stored purely in the user's browser `localStorage` or device `AsyncStorage`.
   - The taste profile is transmitted to the recommendation engine as an anonymous request payload and is **never stored or logged in server databases**.
4. **Collaborative Filtering**:
   - Real collaborative filtering requires a multi-user database with account history. In this standalone version, collaborative filtering is gated behind `collaborative.enabled` (default `false`), backed by a 50-user synthetic seed matrix for offline demonstration and testing.
5. **Mobile API Deterrent**:
   - The `X-App-Token` header provides a basic deterrent against unauthorized scraper scripts. In production, this should be superseded by **Google Play Integrity API** or **Firebase App Check**.

---

## 🌐 Render Deployment Steps

To host the backend and web frontend on Render:

1. Push your repository to GitHub.
2. Log in to [Render.com](https://render.com/) and click **New +** → **Web Service**.
3. Select your repository.
4. Configure service parameters:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start`
5. Under **Environment Variables**, define:
   - `PORT`: `3000`
   - `USE_MOCK_DATA`: `true` (or `false` when using live Google Cloud keys)
   - `GOOGLE_SERVER_KEY`: `<your_google_server_key>`
   - `GOOGLE_BROWSER_KEY`: `<your_google_browser_key>`
   - `APP_CLIENT_TOKEN`: `gulshan_app_secret_token_2026`
6. Click **Create Web Service**. Render will build and deploy your application with an automatic HTTPS URL.

---

## 🔒 Security Audit Verification

A rigorous code scan has been conducted to verify credential safety:
- [server/routes/api.js](file:///server/routes/api.js): `GET /api/config` explicitly returns **only** `googleBrowserKey` and `useMockData`.
- `GET /api/places/photo` proxies Google binary images server-side without redirecting or exposing the key.
- Mobile client codebase (`/mobile`) uses only `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY` and talks strictly to the Express backend via `EXPO_PUBLIC_API_BASE_URL`.

---

## 🧪 Testing

Run the Vitest test suite covering both server algorithms and mobile utilities:
```bash
npm test
```
Outputs:
- Bayesian rating reliability assertions
- Trio A / B / C ranking verification
- Traffic trade-off validation (fast light traffic beating close heavy traffic)
- Taste profile learning, decay, clamping, and dismissal signals
- Discovery similarity mapping and exploration capping
- Mobile formatters and English/Bangla i18n
- P1 contract tests, coarse grid caching, SWR, and quota limit assertions

---

## 💰 Google Cloud Quotas, Budget Alerts & Platform Pricing

> [!IMPORTANT]
> When operating with live Google Cloud API keys, always configure strict billing safeguards in the Google Cloud Console to prevent accidental overdrafts.

1. **Check Current Google Maps Platform Pricing**:
   - Review the official [Google Maps Platform Pricing Guide](https://mapsplatform.google.com/pricing/).
   - Places API (New) Text Search charges per SKU, and Routes API charges per element.
   - Khabo Kothay? minimizes billing by:
     - Caching candidate queries by coarse ~300m spatial grid for 10 minutes.
     - Caching traffic route matrices for 2 minutes with Stale-While-Revalidate (SWR).
     - Loading restaurant details (phone numbers, full opening hours) lazily only when a user taps a card.
2. **Set Quotas and Budget Alerts**:
   - In [Google Cloud Console Billing](https://console.cloud.google.com/billing), create a **Budget Alert** with email notifications at 50%, 80%, 90%, and 100% of your targeted monthly spend.
   - In **APIs & Services** → **Quotas & System Limits**, place daily caps on *Places API (New)* and *Routes API* requests.
3. **Internal Cost Control Kill-Switch**:
   - Khabo Kothay? tracks endpoint consumption at `/api/v1/admin/usage`.
   - When the monthly budget is reached (default 10,000 requests) or the kill-switch is triggered (`POST /api/v1/admin/killswitch`), the API automatically falls back to cached/mock recommendations with a friendly message rather than failing. See [docs/OPERATIONS.md](file:///docs/OPERATIONS.md) for full operational runbooks.
