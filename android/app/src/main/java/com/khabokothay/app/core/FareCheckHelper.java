package com.khabokothay.app.core;

/**
 * F2: Fare Check Utility for Android Client.
 * Formats estimated reference ranges, comparisons, and ensures honest uncertainty disclaimers.
 */
public final class FareCheckHelper {
    private FareCheckHelper() {}

    public static String formatFareRange(int lowerBound, int upperBound) {
        String lowerBn = BengaliFormatter.toBengaliDigits(String.valueOf(lowerBound));
        String upperBn = BengaliFormatter.toBengaliDigits(String.valueOf(upperBound));
        return "৳" + lowerBn + " – ৳" + upperBn;
    }

    public static String getComparisonMessage(int quote, int lowerBound, int upperBound) {
        if (quote < lowerBound) {
            return "আপনার দর আনুমানিক ভাড়ার চেয়ে কম। (Your quote is below the estimated reference range.)";
        }
        if (quote > upperBound) {
            return "আপনার দর আনুমানিক ভাড়ার চেয়ে বেশি। (Your quote is above the estimated reference range.)";
        }
        return "আপনার দর আনুমানিক ভাড়ার সীমার মধ্যে আছে। (Your quote falls within the estimated reference range.)";
    }

    public static String getStandingDisclaimer() {
        return "এটি একটি আনুমানিক নির্দেশক সীমা এবং অসম্পূর্ণ হতে পারে। (This is an estimate and may be incomplete.)";
    }
}
