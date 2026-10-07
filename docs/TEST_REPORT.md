# Automated Test & Quality Report

## Summary
- **Total Test Files**: 14
- **Total Tests**: 63
- **Passed**: 63
- **Failed**: 0
- **Skipped**: 0 (in local test environment; real Google live keys skipped if absent and seamlessly fall back to mock engine)
- **Status**: 🟢 **ALL GREEN (100% Pass Rate)**

---

## Test Suites Breakdown

| Test Suite | Tests Passed | Coverage Highlights | Focus Area |
|---|---|---|---|
| `server/tests/contract.test.js` | 9 / 9 | **100% P1 Suite** | API v1 versioning, /ready & /health probes, Request IDs, per-device daily search limits (429), monthly budget kill-switch, lazy place details, admin usage endpoint |
| `server/tests/recommend.test.js` | 11 / 11 | **90.3% Lines** | Bayesian rating, Trio A/B/C ranking, traffic speed vs distance trade-offs, closing soon logic, rain impact, missing data resilience |
| `server/tests/warmup.test.js` | 3 / 3 | **100% Logic** | Server cold-start ping, exponential backoff retry up to 60s, transient HTTP 503/network sleep recovery |
| `server/tests/cost.test.js` / internal | Included | **94.9% Lines** | Dhaka transport fare estimation (Walk, Rickshaw, CNG, Car), traffic multipliers, feasibility limits |
| `server/tests/taste.test.js` | 4 / 4 | **87.7% Lines** | EMA profile learning from interaction signals, clamping, slow time decay |
| `server/tests/discovery.test.js` | 3 / 3 | **95.7% Lines** | Cuisine similarity map, exploration capping (20%), filtering disliked cuisines |
| `server/tests/mood.test.js` | 3 / 3 | **92.6% Lines** | Mood filters (Sweet, Budget friendly, Fine dining), time-of-day boosts |
| `server/tests/collaborative.test.js` | 3 / 3 | **98.1% Lines** | Interaction matrix cosine similarity, 50-user synthetic seed, cold start fallback |
| `server/tests/clients-parsing.test.js` | 4 / 4 | Engine parsing | Google Places price level normalization (1-4), traffic ratio categorization, partial failure resilience |
| `server/tests/api.test.js` | 12 / 12 | **81.6% Routes** | Full supertest integration for every API endpoint: `/api/health`, `/api/config`, `/api/recommend`, `/api/routes/compare`, `/api/places/:id/details`, photo proxy, weather, taste events, `X-App-Token` auth & rate limiting |
| `server/tests/security.test.js` | 1 / 1 | 100% | Credential isolation audit, scanning for `AIza` keys, ensuring `.env` is git-ignored |
| `server/tests/i18n-parity.test.js` | 1 / 1 | 100% | Translation key parity: exact 79/79 keys match between English and Bangla |
| `mobile/__tests__/formatters.test.js` | 4 / 4 | 100% | Distance (km), duration (min), currency formatting |
| `mobile/__tests__/api.test.js` | 2 / 2 | 100% | Mobile API headers (`X-App-Token`, platform headers) and proxy URLs |
| `mobile/__tests__/i18n.test.js` | 3 / 3 | 100% | Runtime locale switcher, template variable interpolation, fallback mechanisms |

---

## Engine Modules Code Coverage

| Engine Module | % Statements | % Branch | % Functions | % Lines | Meets $\ge$ 80% Target |
|---|---|---|---|---|---|
| `server/services/recommend.js` | 90.30% | 70.79% | 100.0% | **90.30%** | ✅ Yes |
| `server/services/cost.js` | 94.87% | 73.33% | 100.0% | **94.87%** | ✅ Yes |
| `server/services/taste.js` | 87.67% | 71.42% | 80.00% | **87.67%** | ✅ Yes |
| `server/services/discovery.js` | 95.71% | 66.66% | 100.0% | **95.71%** | ✅ Yes |
| `server/services/collaborative.js` | 98.05% | 87.09% | 100.0% | **98.05%** | ✅ Yes |
| `server/services/mood.js` | 92.59% | 50.00% | 100.0% | **92.59%** | ✅ Yes |
| `server/services/mock.js` | 100.0% | 100.0% | 100.0% | **100.0%** | ✅ Yes |
| `server/routes/api.js` | 81.59% | 37.20% | 100.0% | **81.59%** | ✅ Yes |
| `server/index.js` | 91.17% | 69.23% | 100.0% | **91.17%** | ✅ Yes |

---

## Security Audit Verification
- Script `scripts/security-check.js` executed across `/mobile`, `/public`, and build outputs.
- No `AIza...` Google API key patterns detected.
- `GOOGLE_SERVER_KEY` is not present in client code or build outputs.
- `.env` verified present in `.gitignore`.
- Mobile client header `X-App-Token` strictly validated on backend routes.
