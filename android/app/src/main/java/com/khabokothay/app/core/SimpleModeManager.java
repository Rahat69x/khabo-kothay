package com.khabokothay.app.core;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * F12: Simple Mode Manager.
 * Accessible streamlined interface state (Eat now, Call, Directions).
 * Large text, high contrast, screen-reader friendly (Section 15).
 */
public final class SimpleModeManager {
    private static final String PREF_NAME = "khabo_simple_mode";
    private static final String KEY_SIMPLE_MODE_ENABLED = "simple_mode_enabled";

    private SimpleModeManager() {}

    public static boolean isSimpleModeEnabled(Context context) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        return prefs.getBoolean(KEY_SIMPLE_MODE_ENABLED, false);
    }

    public static void setSimpleModeEnabled(Context context, boolean enabled) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(KEY_SIMPLE_MODE_ENABLED, enabled).apply();
    }
}
