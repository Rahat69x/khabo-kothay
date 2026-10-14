# F2 Fare Check — Estimation Methodology
**Document**: `docs/FARE_METHOD.md`  
**Date**: October 15, 2026  
**Status**: Implemented & Verified  

---

## 1. Principles & Honesty Rules
1. **Never Claim Exact or Official Fares**: Fares in Dhaka (especially non-metered rickshaws and CNGs) fluctuate with rain, time of day, and street negotiations. All outputs are explicitly labeled:
   - *"Estimated reference range"*
   - *"This is an estimate and may be incomplete."*
2. **Never Accuse Drivers**: The comparison language is neutral and factual:
   - Below: *"Your quote is below the estimated reference range."*
   - Within: *"Your quote falls within the estimated reference range."*
   - Above: *"Your quote is above the estimated reference range."*
3. **No Fabricated Data**: If insufficient reports exist, the system returns:
   - *"Not enough local fare data to estimate this journey reliably."*

---

## 2. Statistical Estimation Algorithm

### 2.1 Distance Bands
Trips are grouped into distance categories derived from road distance:
- **Short**: `< 1.5 km` (Internal neighborhood hops, e.g. Gulshan-1 to Gulshan-2)
- **Medium**: `1.5 - 3.5 km` (Adjacent areas, e.g. Banani to Baridhara)
- **Medium-Long**: `3.5 - 7.0 km` (Cross-district, e.g. Gulshan to Dhanmondi)
- **Long**: `> 7.0 km` (Suburban journeys, e.g. Banani to Uttara / Airport)

### 2.2 Hierarchical Fallback Resolution
The engine resolves estimates using the lowest available level with adequate sample size:
1. **Level 1 (Area Pair)**: Origin area to destination area for the specified mode (Rickshaw / CNG).
2. **Level 2 (Distance Band)**: Same distance band and mode in Dhaka.
3. **Level 3 (General Mode Pool)**: Broader mode distribution.
4. **Level 4 (Insufficient Data)**: Fails closed with an honest no-data notice.

### 2.3 Age-Weighted Exponential Decay
Fresh reports are prioritized over stale reports using exponential half-life weighting:
$$w_i = 0.5^{\frac{\Delta t}{30 \text{ days}}}$$

### 2.4 Outlier Trimming (Median Absolute Deviation)
To prevent malicious reports or extreme outliers from skewing reference ranges, the median and Median Absolute Deviation (MAD) are computed:
$$\text{MAD} = \text{median}(|x_i - \text{median}(X)|)$$
Reports where $|x_i - \text{median}| > 2.5 \times \text{MAD}$ are pruned.

### 2.5 Output Range
The reference range represents the weighted 25th percentile (lower bound) to 75th percentile (upper bound), with the 50th percentile (median) as the reference midpoint.
