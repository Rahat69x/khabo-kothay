package com.khabokothay.app.core;

import org.junit.Test;
import static org.junit.Assert.*;

public class FeatureFlagsTest {
    @Test
    public void testDefaultFeatureFlags() {
        FeatureFlags.resetDefaults();
        assertTrue(FeatureFlags.outingCost);
        assertTrue(FeatureFlags.closingAlerts);
        assertTrue(FeatureFlags.budgetTracker);
        assertTrue(FeatureFlags.occasionFilters);
        assertTrue(FeatureFlags.homeWidget);
        assertTrue(FeatureFlags.parkingAccess);
        assertFalse(FeatureFlags.hiddenGems);
        assertTrue(FeatureFlags.seasonalGuides);
        assertTrue(FeatureFlags.dishSearch);
        assertTrue(FeatureFlags.wantToTry);
        assertFalse(FeatureFlags.geofenceReminders);
    }
}
