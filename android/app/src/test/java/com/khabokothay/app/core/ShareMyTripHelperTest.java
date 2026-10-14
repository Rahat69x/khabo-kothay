package com.khabokothay.app.core;

import org.junit.Test;
import static org.junit.Assert.*;

public class ShareMyTripHelperTest {

    @Test
    public void buildTripMessage_includesDestinationAndDirectionsLinkWithoutOriginCoordinates() {
        String msg = ShareMyTripHelper.buildTripMessage(
            "Star Kabab",
            "Banani",
            "8:30 PM",
            23.7925,
            90.4078,
            "place_123"
        );

        assertTrue(msg.contains("Star Kabab"));
        assertTrue(msg.contains("Banani"));
        assertTrue(msg.contains("8:30 PM (estimated)"));
        assertTrue(msg.contains("destination=23.7925,90.4078"));
        assertTrue(msg.contains("destination_place_id=place_123"));
        assertFalse(msg.contains("origin=")); // Sender location must NEVER be included
    }
}
