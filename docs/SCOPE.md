# Project Scope & Phasing (Khabo Kothay?)

This document defines the release scopes for **Khabo Kothay?** (খাবো কোথায়?), separating the current focus (**Personal use & friends testing**) from the later **Public release**.

---

## 1. Scope 1: Personal Use & Friends Testing (CURRENT BASELINE)

The primary goal of this phase is proving the core value proposition: *"Does traffic-aware ranking and plain-language explanation genuinely pick the best place to eat right now in Dhaka?"*

- [x] **Traffic-Aware Recommendation Engine**: Places API + Routes API `computeRouteMatrix` with real-time traffic weighting.
- [x] **Multi-Objective Scoring**: Balanced weights for Food Match, Rating/Reviews, Travel Time, Traffic Stress, Price, and Transport Cost.
- [x] **Plain-Language Explanations**: Transparent reasons for every top pick (e.g. *"Closer by 1.2 km but heavy traffic adds 15 min; ranked lower"*).
- [x] **Dual Theme Support**: Indigo & Saffron brand theme in both Light and Dark mode across Web and Android.
- [x] **PWA Installability**: Installable from Chrome on Android with offline fallback shell.
- [x] **Cost & Safety Guardrails**: Circuit breaker daily request cap (`MAX_GOOGLE_REQUESTS_PER_DAY=200`), caching layer, and mock data mode (`USE_MOCK_DATA=true`).
- [x] **Transport Fare Model**: Editable fare rates for Walk, Rickshaw, CNG, and Car with empirical least-squares tuning (`scripts/tune-fares.js`).
- [x] **Anonymous Tester Feedback**: One-tap feedback card (*"Did the top pick make sense?"*) and reporting script (`scripts/feedback-report.js`).
- [x] **Local Privacy**: Zero tracking of user identity; taste profiles stored locally on the device.

---

## 2. Scope 2: Public Release (POSTPONED BEHIND FLAGS)

These features are deliberately postponed until the core ranking algorithm feels accurate to testers and cost profiles are established.

- [ ] **User Accounts & Cloud Sync**: Cloud authentication (Firebase/OAuth) to synchronize taste profiles across multiple phones.
- [ ] **Community Crowdsourcing & Reports**: User-submitted traffic bottlenecks, food photo updates, and bill slips.
- [ ] **Google Play Store Distribution**: Production signing, Play Console store listing, Play Integrity API verification.
- [ ] **Public Privacy Policy & Terms of Service**: Formal legal terms and GDPR/data protection documentation for public release.
- [ ] **In-App Delivery & Table Booking Integrations**: Deep-links and partnerships with Foodpanda, Pathao Food, and restaurant reservation systems.
- [ ] **Social Sharing Feeds**: Sharing dining picks with friends or group coordination voting.

> **Architecture Guarantee**: All postponed public-release features remain disabled behind feature toggles in `server/config/featureFlags.js` until explicitly enabled.
