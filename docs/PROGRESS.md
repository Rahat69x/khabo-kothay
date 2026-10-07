# Khabo Kothay? Project Progress Tracker

## Status Overview
- **Current Phase Completed**: **P1 - Reliability, Cost Control and Operations (MUST)** ✅
- **Test Pass Rate**: 🟢 **63 / 63 Tests Passing (100%) across 14 test suites**
- **Engine Code Coverage**: **> 90%**
- **Next Phase**: **P2 - Smarter Decisions (MUST)**

---

## What Was Completed in Phase P1

### 1. Cost Control & Caching
- **Coarse Grid Caching**: Implemented `getCoarseGrid(lat, lng)` snapping coordinates to a ~300m spatial grid (`0.0027°` lat, `0.0029°` lng) with 10-minute TTL (`600s`).
- **Traffic Caching**: Routes matrix computation cached for 2 minutes (`120s`).
- **Stale-While-Revalidate (SWR)**: Implemented SWR with 5-minute grace window returning immediate hits (<50ms) and asynchronously revalidating in the background.
- **Lazy Place Details**: Only lightweight place metadata is fetched during search; detailed phone numbers and opening hours are lazily loaded on `/api/v1/places/:id/details`.
- **Per-Device Daily Search Limit**: Enforced 50 searches/day per device (`X-Device-Id` / IP), returning HTTP 429 with reset time when exceeded.
- **Global Monthly Request Budget & Kill-Switch**: Capped at 10,000 requests/month; automatically or manually flips to graceful cached/mock fallback with transparent messaging instead of throwing 500 errors.
- **Internal Usage Counter**: Real-time counter by endpoint, device, cache hit ratio, and budget consumption at `/api/v1/admin/usage`.

### 2. Cache Backend
- **Dual-Layer Architecture**: High-speed synchronous in-memory store backed by optional Upstash Redis REST API synchronization via environment variables (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).

### 3. Operations & Observability
- **Structured Logging (pino)**: Configured pino and pino-http with request IDs (`X-Request-Id`) and strict PII redaction (auth tokens, cookies, phone numbers, and coarse-grained coordinates).
- **Liveness & Readiness Probes**: Built `/health` and `/ready` endpoints across root, `/api`, and `/api/v1`.
- **Graceful Shutdown**: Added `SIGTERM` and `SIGINT` handlers with connection draining and 10-second timeout guard.
- **Optional Sentry Monitoring**: Integrated error reporting gated behind `featureFlags.enableSentry` and `SENTRY_DSN`.
- **API Versioning & OpenAPI**: Canonical `/api/v1` routes with backwards-compatible `/api` aliases, full OpenAPI 3.0 specification in [docs/openapi.yaml](file:///docs/openapi.yaml), and contract test suite in [server/tests/contract.test.js](file:///server/tests/contract.test.js).
- **GitHub Actions CI**: Created [.github/workflows/ci.yml](file:///.github/workflows/ci.yml) with matrix testing across Node.js 18, 20, 22.
- **Environment Configurations**: Created distinct configurations for development, staging, and production in [server/config/environments/](file:///server/config/environments/).
- **EAS Update Channels**: Configured channels (`development`, `preview`, `production`) and runtime versioning in [mobile/eas.json](file:///mobile/eas.json) and [mobile/app.config.js](file:///mobile/app.config.js).
- **Runbooks & Guides**: Documented GCP quota management, key rotation, and recovery in [docs/OPERATIONS.md](file:///docs/OPERATIONS.md).

---

## What Changed in the API

| Endpoint | Method | Change / Additions |
|---|---|---|
| `/health`, `/ready` | `GET` | Mounted at root level for cloud orchestrators and probes |
| `/api/v1/health` | `GET` | Returns `{ ok, status: "ok", app, version, commit, uptime }` and `X-Request-Id` |
| `/api/v1/ready` | `GET` | Returns `{ status: "ready", checks: { cache, engine, budget } }` |
| `/api/v1/admin/usage` | `GET` | Returns endpoint hit breakdown, active devices, cache hit ratio, budget status |
| `/api/v1/admin/killswitch` | `POST` | Manually activate/deactivate GCP cost control kill-switch |
| `/api/v1/recommend` | `POST` | Added `X-Device-Id` rate check (429) & `meta.isBudgetFallback` / `meta.budgetMessage` |
| `/api/v1/restaurants/search` | `POST` | Added `X-Device-Id` rate check (429) |
| `/api/v1/*` | All | Canonical versioned endpoints mounted; legacy `/api/*` preserved as backwards-compatible alias |
| All responses | All | Include `X-Request-Id` header for end-to-end request tracing |

---

## Upcoming Phases Roadmap

- [x] **P1 - Reliability, cost control and operations (MUST)** — Completed
- [ ] **P2 - Smarter decisions (MUST)** — Leave now/later departure predictions, time-budget mode ("I have 45 min"), multi-armed bandit personal weights, context signals, dietary/spice preference filters, counterfactual explanations, eval harness.
- [ ] **P3 - Ask in your own words, text or voice (SHOULD)** — "Ask Khabo Kothay" natural language box via Anthropic API with rule-based fallback, voice input with bn-BD and en-US support.
- [ ] **P4 - Group decisions and sharing (SHOULD)** — Multi-origin group optimization sessions, deep linking (`khabokothay://r/<placeId>`), swipe mode.
- [ ] **P5 - Personal food story and utilities (SHOULD)** — Food visit diary, 2-3 stop outing planner, delivery deep links, optional Ramadan/prayer timing mode.
- [ ] **P6 - Local data quality and community (SHOULD)** — Community reports, verification thresholds, admin portal.
- [ ] **P7 - Accounts and sync (NICE)** — Google sign-in, cloud sync, data export.
- [ ] **P8 - Polish and experience (MUST)** — Design system tokens, Bengali typography (Noto Sans Bengali), data saver mode, accessibility pass.
- [ ] **P9 - Security, privacy and release readiness (MUST)** — Google Play Integrity verification, OWASP API review, Play Store preparation.
- [ ] **P10 - Measure and maintain (SHOULD)** — Privacy-friendly KPI telemetry, in-app problem report, changelog.
