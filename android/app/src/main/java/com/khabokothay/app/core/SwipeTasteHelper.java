package com.khabokothay.app.core;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.HashMap;
import java.util.Map;

/**
 * F5: Swipe Mode Taste Preference Helper.
 * Computes soft taste affinities from 10 card choices (swipe right = like, swipe left = pass,
 * save = favorite). Stored locally on device.
 */
public final class SwipeTasteHelper {
    private static final String PREF_NAME = "khabo_swipe_taste";
    private static final String PREFIX_CUISINE_AFFINITY = "affinity_";

    private SwipeTasteHelper() {}

    public static void recordSwipeChoice(Context context, String cuisine, boolean liked, boolean saved) {
        if (cuisine == null) return;
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String key = PREFIX_CUISINE_AFFINITY + cuisine.toLowerCase().trim();
        int current = prefs.getInt(key, 0);

        int delta = saved ? 3 : (liked ? 1 : -1);
        int updated = Math.max(-5, Math.min(10, current + delta));

        prefs.edit().putInt(key, updated).apply();
    }

    public static int getCuisineAffinity(Context context, String cuisine) {
        if (cuisine == null) return 0;
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        return prefs.getInt(PREFIX_CUISINE_AFFINITY + cuisine.toLowerCase().trim(), 0);
    }

    public static void resetTasteProfile(Context context) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().clear().apply();
    }
}
