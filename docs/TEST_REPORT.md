# Test Report — Khabo Kothay? (খাবো কোথায়?)
# Date: 2026-10-12
# Phase: Phase 2 — Full Test Run

---

## 1. Test Execution Summary Table

| Suite Name | Exact Command Executed | Result | Counts / Metrics | Duration | Notes |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **API Code Linting** | `ruff check api` | **PASS** | 0 errors across 13 files | 0.4s | Clean lint status |
| **API Code Formatting** | `ruff format --check api` | **PASS** | 13 files formatted | 0.2s | PEP 8 / Ruff compliant |
| **API Type Checking** | `mypy -p app` (MYPYPATH=api) | **PASS** | 0 errors in 11 source files | 1.1s | Fully typed, PEP 561 marker present |
| **API Automated Tests** | `python -m pytest --cov=app api/tests` | **PASS** | 4 / 4 passed | 0.97s | Health, clock, guard, flags (86% cov) |
| **API Dependency Audit** | `pip-audit -r api/requirements.txt` | **PASS** | 0 vulnerabilities found | 3.2s | Clean PyPI advisory check |
| **Legacy Node Server** | `npm test` (vitest run) | **PASS** | 159 / 159 passed (25 test files) | 7.21s | Meal-time, routes, predictions, taste, auth |
| **Legacy Node Audit** | `npm audit --audit-level=high` | **WARN** | 7 devDependency advisories | 1.8s | Dev dependencies (vitest/tinypool) reported |
| **Android Unit Tests** | `java -cp ... JUnitCore <test_classes>` | **PASS** | 7 / 7 passed | 0.03s | BengaliFormatter, Clock, Flags, Notifications |
| **Android Lint & Assemble** | `.\gradlew.bat lint`, `assembleDebug` | **NOT RUN** | Gradle wrapper missing | — | NOT RUN: gradlew.bat not installed locally. Run: install gradle and wrapper |
| **Android Connected Test** | `.\gradlew.bat connectedDebugAndroidTest` | **NOT RUN** | No adb / device on PATH | — | NOT RUN: adb not detected on PATH. Run: start emulator and run connectedDebugAndroidTest |
| **Android Key Parity** | `node scripts/verify-android-strings.cjs` | **PASS** | 21 / 21 keys match (100%) | 0.1s | Perfect parity between values/ and values-bn/ |
| **Mobile i18n Key Parity**| `node scripts/verify-i18n-keys.js` | **PASS** | 141 / 141 keys match (100%) | 0.1s | Perfect parity between en.js and bn.js |
| **Security Leak Check** | `node scripts/security-check.js` | **PASS** | 0 leaked API keys or credentials | 0.2s | Scanned public/, mobile/, build/ |
| **Secret Scan (History)** | `python scripts/secret_scan.py` | **PASS** | 0 findings in tree & 29 commits | 6.8s | Regex scan for AIza, tokens, private keys |
| **Placeholder Scan** | `python scripts/find_placeholders.py` | **PASS** | 0 code placeholders (138 files) | 0.8s | No TODO, FIXME, lorem ipsum |
| **Link Integrity Checker**| `python scripts/check_links.py` | **WARN** | 1 OK (APK), 5 pre-deploy 404s | 3.4s | Drive APK link 200; Render pre-launch 404s |

---

## 2. Environment Verification Details
* **Java SDK**: `Temurin-17.0.20.1+1` (OpenJDK 17 64-bit) — **PASS**
* **Python Runtime**: `Python 3.13.14` — **PASS**
* **Node.js Runtime**: `v24.18.0` — **PASS**
* **Android Gradle Wrapper (`gradlew.bat`)**: **MISSING** on local machine (addressed in Phase 3 hygiene).
* **Android Debug Bridge (`adb`)**: **MISSING** on local machine PATH (Espresso connected tests marked NOT RUN).
