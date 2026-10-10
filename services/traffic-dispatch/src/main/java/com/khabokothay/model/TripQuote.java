package com.khabokothay.model;

/**
 * Detailed transportation fare and travel duration quotation.
 */
public record TripQuote(
        TransitMode mode,
        double distanceKm,
        double estimatedDurationMinutes,
        double fareBdt,
        double surgeMultiplier,
        boolean routePermitted,
        String restrictionNotes
) {
    public TripQuote {
        if (distanceKm < 0) throw new IllegalArgumentException("Distance cannot be negative");
        if (estimatedDurationMinutes < 0) throw new IllegalArgumentException("Duration cannot be negative");
        if (fareBdt < 0) throw new IllegalArgumentException("Fare cannot be negative");
    }

    public String formattedSummary() {
        if (!routePermitted) {
            return String.format("%-18s: RESTRICTED (%s)", mode.getDisplayName(), restrictionNotes);
        }
        return String.format("%-18s: %.1f km | ~%.0f mins | ৳%.0f (Surge: %.2fx)",
                mode.getDisplayName(), distanceKm, estimatedDurationMinutes, fareBdt, surgeMultiplier);
    }
}
