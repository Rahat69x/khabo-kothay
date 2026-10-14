package com.khabokothay.app.core;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.HashSet;
import java.util.Set;

/**
 * F8: Dietary Preferences Manager.
 * Stores dietary choices (Halal, Vegetarian, No Beef, Spice Level) strictly on device.
 * Enforces standing allergy disclaimer per Section 11.
 */
public final class DietaryPreferencesManager {
    private static final String PREF_NAME = "khabo_dietary_prefs";
    private static final String KEY_PREFERENCES = "dietary_tags";
    private static final String KEY_MAX_SPICE = "max_spice_level";

    public static final String TAG_HALAL = "halal";
    public static final String TAG_VEGETARIAN = "vegetarian";
    public static final String TAG_NO_BEEF = "no_beef";

    private DietaryPreferencesManager() {}

    public static Set<String> getSelectedTags(Context context) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        return new HashSet<>(prefs.getStringSet(KEY_PREFERENCES, new HashSet<>()));
    }

    public static void setSelectedTags(Context context, Set<String> tags) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().putStringSet(KEY_PREFERENCES, tags).apply();
    }

    public static int getMaxSpiceLevel(Context context) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        return prefs.getInt(KEY_MAX_SPICE, 3); // 1 to 5 scale
    }

    public static void setMaxSpiceLevel(Context context, int level) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().putInt(KEY_MAX_SPICE, Math.max(1, Math.min(5, level))).apply();
    }

    public static String getAllergyDisclaimer() {
        return "ডায়েটারি তথ্য অসম্পূর্ণ হতে পারে। অ্যালার্জির ক্ষেত্রে দয়া করে রেস্তোরাঁর সাথে নিশ্চিত করুন। (Dietary information may be incomplete. Please confirm with the restaurant, especially for allergies.)";
    }
}
