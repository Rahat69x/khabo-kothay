# System Architecture

## Overview
**Khabo Kothay?** (Bangla: খাবো কোথায়?) is a full-stack, traffic-aware dining recommendation system for Gulshan, Banani, Baridhara, and Notun Bazar in Dhaka, Bangladesh. It solves the critical question: *"Where should I actually go right now, and why?"*

Instead of purely listing nearby places by geometric distance, it factors in real-time Dhaka road traffic (Routes API), multi-modal transit costs (rickshaw, CNG, car, walk), user culinary taste affinity, time-of-day mood, and candidate-set rating reliability (Bayesian average).

---

## High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Clients
        Web["Web Frontend (Vanilla JS ES Modules)"]
        Mobile["Android Mobile App (React Native Expo)"]
    end

    subgraph BackendGateway["Node.js / Express Server (Port 3000)"]
        Middleware["Helmet • CORS • Rate Limiter • App Token Auth"]
        Routes["API Router (/api)"]
        Cache["In-Memory TTL Cache Helper"]
    end

    subgraph ServiceLayer["Services Layer"]
        Places["places.js (Places API New)"]
        RoutesSvc["routes.js (Routes API Matrix)"]
        Cost["cost.js (Dhaka Fares Model)"]
        Recommend["recommend.js (Bayesian & Multi-factor Scoring)"]
        Taste["taste.js (EMA & Decay Engine)"]
        Mood["mood.js (Mood Mapping & Hour Signal)"]
        Discovery["discovery.js (Cuisine Similarity & Rut Breaker)"]
        Collab["collaborative.js (Cosine Similarity Matrix)"]
        Weather["weather.js (Open-Meteo Integration)"]
    end

    subgraph ExternalAPIs["External Services"]
        GooglePlaces["Google Places API (New)"]
        GoogleRoutes["Google Routes API"]
        OpenMeteo["Open-Meteo Weather API"]
    end

    Web -->|HTTP / JSON| Middleware
    Mobile -->|X-App-Token + JSON| Middleware
    Middleware --> Routes
    Routes --> Cache
    Routes --> Recommend
    Recommend --> Places
    Recommend --> RoutesSvc
    Recommend --> Cost
    Recommend --> Taste
    Recommend --> Mood
    Recommend --> Discovery
    Recommend --> Collab
    Recommend --> Weather

    Places -->|GOOGLE_SERVER_KEY| GooglePlaces
    RoutesSvc -->|GOOGLE_SERVER_KEY| GoogleRoutes
    Weather --> OpenMeteo
```

---

## Security Model & Key Isolation

1. **Google Server Key (`GOOGLE_SERVER_KEY`)**:
   - Used strictly on the Node.js backend.
   - Never sent to the browser or embedded into the mobile APK.
   - Places photos are streamed via the backend proxy endpoint `GET /api/places/photo?name=...` so Google API credentials never touch the client.
2. **Google Browser Key (`GOOGLE_BROWSER_KEY`)**:
   - Exposed only through `GET /api/config` for rendering Google Maps JavaScript API on the web.
   - Must be restricted in Google Cloud Console by **HTTP Referrer** (e.g. `https://your-domain.com/*` or `http://localhost:*`).
3. **Android Maps Key (`EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY`)**:
   - Restricted in Google Cloud Console by **Android Package Name** (`com.example.cafefinder`) and **SHA-1 Certificate Fingerprint**.
4. **Mobile API Deterrent (`X-App-Token`)**:
   - A secret token (`APP_CLIENT_TOKEN`) checked by the Express server for mobile app traffic.
5. **Content Security Policy (CSP)**:
   - Helmet configured to allow Google Maps scripts, Google static tiles, and font assets while blocking unauthorized scripts.

---

## Data Flow & Scoring Pipeline

```mermaid
sequenceDiagram
    participant User as User / App
    participant Express as Express /api/recommend
    participant Places as Places Service
    participant Routes as Routes Service
    participant Engine as Recommendation Engine

    User->>Express: POST /api/recommend (lat, lng, cuisine, priority, budget, tasteProfile, mood)
    Express->>Places: Search Candidates (20 max)
    Places-->>Express: Return Candidates
    Express->>Routes: computeTravelTimes (TRAFFIC_AWARE drive + static)
    Routes-->>Express: Return duration, distance, trafficLevel
    Express->>Engine: rankRestaurants(candidates, weights, taste, weather)
    Note over Engine: 1. Bayesian Rating calculation<br/>2. Min-max normalization<br/>3. Budget & closing penalties<br/>4. Discovery badge assignment<br/>5. Generate trade-off reason text
    Engine-->>Express: Ranked list + top picks
    Express-->>User: JSON response with badges, reasons & breakdowns
```

---

## How to Add a New Recommendation Factor

1. **Update Weights**: Add the factor weight in [server/config/weights.json](file:///server/config/weights.json) under each priority preset.
2. **Calculate Raw Value**: Calculate the raw metric in a helper service (e.g., parking availability, outdoor seating).
3. **Normalize Factor**: Inside `rankRestaurants()` in [server/services/recommend.js](file:///server/services/recommend.js), normalize the raw metric across candidates to a `0.0 - 1.0` ratio.
4. **Blend into Score**: Multiply by `weights[factorName]` and add to `baseScore`.
5. **Update Reason Generator**: Extend `generateRecommendationReason()` to highlight the factor when significant.
6. **Add Unit Test**: Add assertions in [server/tests/recommend.test.js](file:///server/tests/recommend.test.js).

---

## How to Add a New Mobile Screen

1. Create screen component in `mobile/src/features/<feature>/<FeatureScreen>.js`.
2. Add route to `mobile/App.js` in either `BottomTabs` or `Stack.Navigator`.
3. Add English and Bangla translation strings in `mobile/src/i18n/en.js` and `mobile/src/i18n/bn.js`.
4. Wrap new endpoints in `mobile/src/api/client.js`.
