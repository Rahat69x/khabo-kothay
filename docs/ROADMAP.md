# KHABO KOTHAY? — Long-Term Product Roadmap
**Document**: `docs/ROADMAP.md`  
**Date**: October 15, 2026  
**Reference**: Section 19 (Future Roadmap Specifications)

---

## 1. 15 Upgraded Features (Current Release v4.0.0)
- [x] **F1: Update Checker & What\'s New** — In-app version verification, external browser download flow, server HTTP 426 enforcement, bilingual release notes.
- [x] **F2: Fare Check** — Crowdsourced rickshaw & CNG reference range estimation with age weighting and MAD outlier trimming.
- [x] **F3: Ask In Your Own Words** — Hybrid Banglish/Bangla natural query parser with 65-item labeled corpus and voice helper.
- [x] **F4: Group Mode** — Unguessable 128-bit session tokens, multi-origin fair ranking algorithm, and anonymous voting.
- [x] **F5: Swipe Mode** — 1-minute taste setup with restaurant swipe cards feeding soft ranking preferences.
- [x] **F6: Dish Prices** — Community-reported dish prices with median display and outlier moderation.
- [x] **F7: Rain-Aware Mode** — Weather-aware recommendations favoring closer spots when precipitation is predicted.
- [x] **F8: Dietary Preferences** — Structured preferences (Halal, Vegetarian, No Beef, Spice Level) with verification tags.
- [x] **F9: Lunch-Break Reminder** — WorkManager meal-time alerts with time-budget feasible spots and zero background GPS.
- [x] **F10: Share My Trip** — Native share sheet with public destination-only Google Maps directions links.
- [x] **F11: Pay-Me Line in Bill Split** — On-device encrypted bKash/Nagad number line (never sent over the network).
- [x] **F12: Simple Mode** — Streamlined accessible UI with 3 prominent actions and high-contrast typography scaling.
- [x] **F13: Food Story** — 100% on-device monthly/yearly dining highlights from consented local history.
- [x] **F14: Remote Feature Flags** — Server-side staged rollout with stable hash assignment, 6h cache, and audit log.
- [x] **F15: Opt-In Crash Reports & Problem Reports** — Consented error capture, secret redaction, and admin diagnostics triage.

---

## 2. Future Roadmap (Prerequisites & Specifications Only — Not Built Yet)

Per Section 19, the following three advanced features are documented with their architectural prerequisites. No mock screens or fabricated data are included until legitimate data feeds and partnerships are secured.

### Feature A: Card & Mobile Wallet Offers
- **Concept**: Display active discounts, BOGO (Buy-One-Get-One), and cashback offers for bank cards (e.g. City Bank Amex, Standard Chartered, BRAC Bank) and mobile wallets (bKash, Nagad).
- **Prerequisites**:
  - Official partner feed integration or verified merchant portal.
  - Eligibility rules engine: minimum spend, specific card tiers, dine-in vs. takeaway restrictions.
  - Automated TTL & expiration cleaner to immediately purge expired promotions.
- **Honesty Rule**: Never invent discounts or claim an offer is valid without verified, real-time partner confirmation.

### Feature B: Multi-Stop Outing Planner
- **Concept**: Plan an entire afternoon or evening outing with consecutive stops (e.g., Afternoon Coffee in Banani 11 $\rightarrow$ Dinner in Gulshan 2 $\rightarrow$ Dessert/Tea in Baridhara).
- **Prerequisites**:
  - Multi-destination route matrix optimizer respecting sequential time windows.
  - Strict opening and closing hour validation ensuring subsequent venues remain open upon arrival.
  - Consolidated time-budget and transport cost aggregation.
- **Honesty Rule**: Only plan itineraries that real route data and verified opening hours can genuinely support.

### Feature C: "Order In Instead" Delivery Integration
- **Concept**: Provide instant delivery availability alternatives when traffic is severe, rain is heavy, or users prefer dining at home.
- **Prerequisites**:
  - Verified deep-linking partnership with licensed food delivery platforms in Dhaka (Foodpanda, Pathao Food).
  - Real-time delivery availability and accurate delivery fee data.
  - Clear separation of partner delivery data from organic in-app restaurant listings.
- **Honesty Rule**: Never simulate or claim to place an order in-app; use verified external deep links only.
