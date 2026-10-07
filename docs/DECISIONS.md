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
