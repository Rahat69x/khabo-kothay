package com.khabokothay.app.core;

public final class FeatureFlags {
    public static boolean outingCost = true;
    public static boolean closingAlerts = true;
    public static boolean budgetTracker = true;
    public static boolean occasionFilters = true;
    public static boolean homeWidget = true;
    public static boolean parkingAccess = true;
    public static boolean hiddenGems = false; // Built late in Task 7
    public static boolean seasonalGuides = true;
    public static boolean dishSearch = true;
    public static boolean wantToTry = true;
    public static boolean geofenceReminders = false; // Off by default until Play declaration

    private FeatureFlags() {}

    public static void resetDefaults() {
        outingCost = true;
        closingAlerts = true;
        budgetTracker = true;
        occasionFilters = true;
        homeWidget = true;
        parkingAccess = true;
        hiddenGems = false;
        seasonalGuides = true;
        dishSearch = true;
        wantToTry = true;
        geofenceReminders = false;
    }
}
