# Product & Technical Roadmap

## Phase 1 (Completed in Current Release)
- [x] Express backend with Places API (New) & Routes API matrix.
- [x] Dhaka multi-modal transport cost estimator (Rickshaw, CNG, Car, Walk) with traffic multipliers.
- [x] Recommendation engine with Bayesian rating average, multi-priority weights, closing-soon logic, and trade-off reason generator.
- [x] Personalization engine: Taste Profile with EMA learning, decay, discovery engine ("Try something new"), and mood mappings.
- [x] Mobile-first responsive vanilla JS frontend with Google Maps JS API and interactive mock fallback.
- [x] React Native Expo Android mobile app with bottom tabs, map markers, English/Bangla translations, call/directions linking, and EAS APK configuration.

---

## Phase 2 (Near-Term Improvements)
- [ ] **Persistent Database & Sync**:
  - Replace in-memory interaction matrices and browser-only localStorage with a cloud PostgreSQL / Supabase backend.
  - Implement anonymous token-based cross-device sync.
- [ ] **Google Play Integrity / Firebase App Check**:
  - Upgrade from static `X-App-Token` to cryptographic hardware-backed attestation (Play Integrity API) before public Play Store launch.
- [ ] **Real-Time Live Traffic Feeds**:
  - Integrate Dhaka Traffic Police Twitter / crowdsourced live congestion alerts to override standard route matrices during VIP protocols or protests.
- [ ] **Food Delivery Deep-Links**:
  - Provide direct order buttons for Foodpanda, Pathao Food, and HungryNaki when available for candidate restaurants.

---

## Phase 3 (Advanced Intelligence)
- [ ] **Matrix Factorization Collaborative Filtering**:
  - Run asynchronous Singular Value Decomposition (SVD) on user interaction logs to compute latent taste factors.
- [ ] **Natural Language Voice Assistant**:
  - Enable conversational voice search in Bangla and English (e.g. *"Show me somewhere spicy within 15 minutes of Notun Bazar"*).
