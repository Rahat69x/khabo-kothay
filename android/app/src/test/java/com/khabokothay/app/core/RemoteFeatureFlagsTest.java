package com.khabokothay.app.core;

import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;

public class RemoteFeatureFlagsTest {

    @Before
    public void setUp() {
        RemoteFeatureFlags.resetDefaults();
    }

    @Test
    public void isEnabled_returnsCompiledDefaultsFor16Features() {
        assertTrue(RemoteFeatureFlags.isEnabled("update_checker"));
        assertTrue(RemoteFeatureFlags.isEnabled("natural_language_search"));
        assertTrue(RemoteFeatureFlags.isEnabled("voice_search"));
        assertTrue(RemoteFeatureFlags.isEnabled("group_mode"));
        assertTrue(RemoteFeatureFlags.isEnabled("fare_check"));
        assertTrue(RemoteFeatureFlags.isEnabled("dish_prices"));
        assertTrue(RemoteFeatureFlags.isEnabled("rain_aware_mode"));
        assertTrue(RemoteFeatureFlags.isEnabled("crash_reporting"));
    }

    @Test
    public void setFlagForTesting_updatesValue() {
        RemoteFeatureFlags.setFlagForTesting("fare_check", false);
        assertFalse(RemoteFeatureFlags.isEnabled("fare_check"));

        RemoteFeatureFlags.setFlagForTesting("fare_check", true);
        assertTrue(RemoteFeatureFlags.isEnabled("fare_check"));
    }
}
