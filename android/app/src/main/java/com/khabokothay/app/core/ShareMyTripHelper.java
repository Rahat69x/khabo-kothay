package com.khabokothay.app.core;

import android.content.Context;
import android.content.Intent;
import java.net.URLEncoder;

/**
 * F10: Share My Trip Helper.
 * Builds shareable message using native share sheet.
 * Directions link uses public destination coordinates/placeId only (never sender GPS).
 * NO background activity, NO live tracking (Section 13).
 */
public final class ShareMyTripHelper {
    private ShareMyTripHelper() {}

    public static String buildTripMessage(String restaurantName, String areaName, String etaText, double destLat, double destLng, String placeId) {
        StringBuilder sb = new StringBuilder();
        sb.append("আমি যাচ্ছি ");
        sb.append(restaurantName != null ? restaurantName : "রেস্তোরাঁয়");
        if (areaName != null && !areaName.isEmpty()) {
            sb.append(" (").append(areaName).append(")");
        }
        sb.append("।\n");

        if (etaText != null && !etaText.isEmpty()) {
            sb.append("আনুমানিক পৌঁছানোর সময়: ").append(etaText).append(" (estimated)\n");
        }

        // Public Google Maps directions URL targeting destination only
        String mapsUrl;
        try {
            String query = destLat + "," + destLng;
            if (placeId != null && !placeId.isEmpty()) {
                mapsUrl = "https://www.google.com/maps/dir/?api=1&destination=" + query + "&destination_place_id=" + URLEncoder.encode(placeId, "UTF-8");
            } else {
                mapsUrl = "https://www.google.com/maps/dir/?api=1&destination=" + query;
            }
        } catch (Exception e) {
            mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + destLat + "," + destLng;
        }

        sb.append("লোকেশন ম্যাপ: ").append(mapsUrl);
        return sb.toString();
    }

    public static Intent createShareIntent(String message) {
        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_SUBJECT, "Khabo Kothay - Dining Out");
        intent.putExtra(Intent.EXTRA_TEXT, message);
        return Intent.createChooser(intent, "Share My Trip via");
    }
}
