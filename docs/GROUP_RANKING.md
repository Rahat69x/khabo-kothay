# F4 Group Mode — Fair Multi-Origin Ranking Policy
**Document**: `docs/GROUP_RANKING.md`  
**Date**: October 15, 2026  
**Status**: Implemented & Verified  

---

## 1. Core Philosophy: Why Creator-Centric Ranking Fails
Traditional dining apps rank results based solely on the searcher's (creator's) location. For groups meeting across Dhaka (e.g. one friend in Banani, one in Gulshan, and one in Baridhara), this disproportionately burdens distant participants with long travel times through traffic bottlenecks.

KHABO KOTHAY? implements a **Multi-Origin Fair Ranking Engine**:
- Evaluates travel times from *every* participant's starting point.
- Minimizes the average travel time while strictly penalizing the maximum travel time and the travel-time disparity (spread).
- Explicitly labels results as *"Fair Ranking"* rather than *"Optimal"*.

---

## 2. Mathematical Scoring Model

For a candidate restaurant $R$ and a group of $N$ participants $P_1, P_2, \dots, P_N$:

### 2.1 Metrics Computed
1. **Travel Time Vector**: $\{T_1, T_2, \dots, T_N\}$ (in minutes) via routing service.
2. **Average Travel Time**:
   $$T_{\text{avg}} = \frac{1}{N} \sum_{i=1}^N T_i$$
3. **Maximum Travel Time**:
   $$T_{\text{max}} = \max_{1 \le i \le N} T_i$$
4. **Travel Time Spread**:
   $$T_{\text{spread}} = T_{\text{max}} - \min_{1 \le i \le N} T_i$$

### 2.2 Fair Composite Score
$$\text{FairScore} = \max\left(0, 100 - (0.45 \times T_{\text{avg}} + 0.35 \times T_{\text{max}} + 0.20 \times T_{\text{spread}})\right)$$

- **Weight Rationale**:
  - `45%` weight on average travel time rewards central locations.
  - `35%` weight on maximum travel time protects the single furthest participant from extreme commutes.
  - `20%` weight on travel spread ensures no single person has an effortless 2-minute trip while others travel 45 minutes.

---

## 3. Privacy & Safety Safeguards
- **Origin Obfuscation**: Participants submit area names or landmarks (e.g., *"Banani"*, *"Notun Bazar"*). Exact GPS coordinates are never stored or shared with other group members.
- **Unguessable Tokens**: Session links contain 128-bit cryptographically secure random tokens (`crypto.randomBytes(16)`).
- **Session Expiration**: Group dining sessions automatically expire after 3 hours.
