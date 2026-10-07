# Google Cloud Setup Guide (Khabo Kothay?)

This guide walks you through configuring Google Maps Platform API credentials for development and production.

---

## 1. Create Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Select a project** $\to$ **New Project**.
3. Name it `khabo-kothay` and click **Create**.
4. Link an active billing account (Google Cloud provides $200 free monthly credit for Maps Platform).

---

## 2. Enable Required APIs
Enable the following 3 APIs from **APIs & Services** $\to$ **Library**:
1. **Places API (New)** — Used on the backend for text search, place details, photos, and ratings.
2. **Routes API** — Used on the backend for traffic-aware travel times and distance matrix (`computeRouteMatrix`).
3. **Maps JavaScript API** — Used on the frontend web client to render interactive maps.

---

## 3. Create TWO Separate API Keys (Principle of Least Privilege)

### Key 1: Server Key (`GOOGLE_SERVER_KEY`)
Used **strictly** by the Express backend. Never send this to the browser or mobile bundle.
1. Go to **APIs & Services** $\to$ **Credentials** $\to$ **Create Credentials** $\to$ **API key**.
2. Rename to `khabo-kothay-server-key`.
3. Under **API restrictions**, select **Restrict key**:
   - Check **Places API (New)**
   - Check **Routes API**
4. Under **Application restrictions**, select **IP addresses** (set your production server IP in production; leave Unrestricted or set to localhost for development).
5. Copy to `.env` as `GOOGLE_SERVER_KEY`.

### Key 2: Browser Key (`GOOGLE_BROWSER_KEY`)
Used **only** for client-side map rendering. Served via `GET /api/config`.
1. Create another API key and rename to `khabo-kothay-browser-key`.
2. Under **API restrictions**, select **Restrict key**:
   - Check **Maps JavaScript API** ONLY.
3. Under **Application restrictions**, select **Websites (HTTP referrers)**:
   - For dev: `http://localhost:*/*`, `http://127.0.0.1:*/*`
   - For prod: `https://your-domain.onrender.com/*`
4. Copy to `.env` as `GOOGLE_BROWSER_KEY`.

---

## 4. Set Budget Alerts & Quotas
1. Go to **Billing** $\to$ **Budgets & alerts**.
2. Create a budget alert at **$10**, **$20**, and **$50** with email notifications.
3. Under **APIs & Services** $\to$ **Places API (New)** $\to$ **Quotas**:
   - Set maximum requests per day to prevent unexpected runaway costs.
4. The backend includes a built-in safety circuit breaker controlled by `MAX_GOOGLE_REQUESTS_PER_DAY=200` in `.env`.

---

## 5. Pricing Note
Always review current pricing at [Google Maps Platform Pricing](https://developers.google.com/maps/billing-and-pricing/pricing):
- Places API (New) Text Search charges per request and per field mask category (Basic, Contact, Atmosphere). Use minimal field masks (`id,displayName,rating,userRatingCount,priceLevel,regularOpeningHours,photos`).
- Routes API `computeRouteMatrix` with `TRAFFIC_AWARE` charges per element. The server batches destinations up to 20 elements per origin.
