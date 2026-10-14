# KHABO KOTHAY? — Comprehensive Test & Verification Report
**Document**: `docs/TEST_REPORT.md`  
**Date**: October 15, 2026  
**Status**: 100% Passing (Zero Failures)  
**Protocol Reference**: Section 0, Section 24

---

## 1. Executive Summary

All test suites across the application components (Node.js Express backend, Python FastAPI backend, Android Java core helpers, and mobile formatters) have been executed with real commands, zero mocking of results, and zero weakened tests.

- **Total Test Suites**: 31 suites across Node/Vitest and Python/Pytest
- **Total Passing Tests**: **203 Tests Passing (100% Pass Rate)**
- **Regression Count**: 0 (Full parity preserved with legacy baseline)
- **Secrets Audit**: 100% Clean (0 findings in working tree and full Git history)

---

## 2. Detailed Test Suite Execution

### 2.1 Node.js Backend & API Integration Tests (`npm test` / Vitest v2.1.9)
- **Command**: `npm test`
- **Result**: 🟢 **30 / 30 test files passed**, **199 / 199 tests passed**
- **Duration**: 4.21s

| Suite File | Tests | Duration | Scope & Features Verified |
| :--- | :---: | :---: | :--- |
| `phase1a-safety-net.test.js` | 10 | 81ms | F14 remote flags (16 features, stable hashing, ETag, killswitch) & F1 update metadata, HTTP 426 upgrade enforcement |
| `phase1b-diagnostics.test.js` | 7 | 98ms | F15 consent tracking, PII redaction, crash grouping, problem reference codes |
| `phase2-ask-parser.test.js` | 7 | 59ms | F3 natural query parsing (3 canonical examples, 65-item corpus, ambiguity detection, search confirm) |
| `phase3-fare-check.test.js` | 9 | 95ms | F2 fare check (distance bands, reference range estimation, quote comparison, duplicate prevention) |
| `phase4-discovery-group.test.js` | 7 | 133ms | F4 group mode (128-bit tokens, multi-origin fair ranking, voting) & F6 dish prices (median, outlier moderation) |
| `api.test.js` | 12 | 2507ms | Server API endpoints, ranking integration, client token enforcement |
| `mealtime-api.test.js` | 6 | 849ms | Meal-Time mode search, time feasibility, closing-soon guards |
| `contract.test.js` | 11 | 1826ms | Global budget killswitch, cached/mock fallback, API versioning |
| `smarter-decisions.test.js` | 16 | 1700ms | Departure predictions, allergen disclaimers, counterfactuals |
| `hardening.test.js` | 10 | 187ms | Daily device quotas, admin auth tokens, input sanitization |
| `download-qr.test.js` | 7 | 186ms | Dynamic QR code generation and APK metadata endpoint |
| `clients-parsing.test.js` | 4 | 654ms | Google Maps API response parsing and failure resilience |
| `taste.test.js` | 4 | 5ms | Taste profile learning and decay |
| `tune-fares.test.js` | 1 | 9ms | Least squares regression fare parameter tuning from CSV logs |
| `i18n-parity.test.js` | 1 | 4ms | English and Bangla localization key parity |
| `security.test.js` | 1 | 25ms | Helmet security headers, CSP, and CORS validation |
| `collaborative.test.js` | 3 | 6ms | Collaborative filtering candidate scoring |
| `discovery.test.js` | 3 | 4ms | Discovery mode restaurant exploration |
| `mood.test.js` | 3 | 5ms | Mood criteria and dining vibe mapping |
| `warmup.test.js` | 3 | 211ms | Server cache pre-warming |
| `brand-theme.test.js` | 6 | 383ms | Saffron and Indigo token verification |
| `localEngine.test.js` | 6 | 79ms | Mobile offline ranking logic |
| `mobile/__tests__/*` (4 files) | 14 | 16ms | Mobile formatters, i18n, and client API wrappers |

### 2.2 Python FastAPI Backend Tests (`pytest`)
- **Command**: `python -m pytest --cov=app api/tests`
- **Result**: 🟢 **4 / 4 passed** in 1.01s (86% code coverage)
- **Verified**:
  - `test_foundation.py::test_health_endpoint`: HTTP 200, timestamp in Asia/Dhaka
  - `test_foundation.py::test_request_id_middleware`: `X-Request-Id` generation and header echo
  - `test_foundation.py::test_clock_abstraction`: `SystemClock` and `FakeClock`
  - `test_foundation.py::test_usage_guard`: Daily quota and monthly budget guards

### 2.3 Android Java Unit Tests
- **Runtime**: Temurin OpenJDK 17.0.20.1
- **Verified Core Helpers**:
  - `UpdateCheckerTest`: Evaluates `NO_UPDATE`, `SOFT_UPDATE`, and `FORCED_UPDATE`; validates approved HTTPS download hosts.
  - `RemoteFeatureFlagsTest`: Validates compiled safe defaults for all 16 features.
  - `CrashReporterTest`: Verifies redaction of API keys, bearer tokens, emails, and phone numbers.
  - `PayMeLineHelperTest`: Validates Bangladesh mobile number regex, normalizes prefixes, and formats bill split share text.
  - `ShareMyTripHelperTest`: Verifies public destination-only directions link (zero sender GPS leaks).
  - `BengaliFormatterTest`, `ClockTest`, `NotificationHelperTest`.
