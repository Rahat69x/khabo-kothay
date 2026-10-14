package com.khabokothay.app.core;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONObject;
import java.util.HashMap;
import java.util.Map;

/**
 * F14: Remote Feature Flags Client & Local Cache.
 * Holds compiled-in safe defaults and stores remote evaluated flag responses.
 */
public final class RemoteFeatureFlags {
    private static final String PREF_NAME = "khabo_remote_flags";
    private static final String KEY_FLAGS_JSON = "flags_json";
    private static final String KEY_ETAG = "flags_etag";
    private static final String KEY_LAST_FETCH = "flags_last_fetch_ms";
    private static final long CACHE_TTL_MS = 6 * 60 * 60 * 1000L; // 6 Hours TTL

    // In-memory evaluated flag cache
    private static final Map<String, Boolean> flagCache = new HashMap<>();

    static {
        loadCompiledDefaults();
    }

    private RemoteFeatureFlags() {}

    private static void loadCompiledDefaults() {
        flagCache.put("update_checker", true);
        flagCache.put("natural_language_search", true);
        flagCache.put("voice_search", true);
        flagCache.put("group_mode", true);
        flagCache.put("swipe_mode", true);
        flagCache.put("fare_check", true);
        flagCache.put("dish_prices", true);
        flagCache.put("rain_aware_mode", true);
        flagCache.put("lunch_break_reminders", true);
        flagCache.put("share_my_trip", true);
        flagCache.put("dietary_preferences", true);
        flagCache.put("pay_me_line", true);
        flagCache.put("simple_mode", true);
        flagCache.put("food_story", true);
        flagCache.put("crash_reporting", true);
        flagCache.put("report_a_problem", true);
    }

    public static synchronized boolean isEnabled(String key) {
        Boolean value = flagCache.get(key);
        return value != null ? value : false;
    }

    public static synchronized void setFlagForTesting(String key, boolean value) {
        flagCache.put(key, value);
    }

    public static synchronized void updateFromRemoteJson(Context context, String jsonPayload, String etag) {
        try {
            JSONObject obj = new JSONObject(jsonPayload);
            JSONObject flagsObj = obj.optJSONObject("flags");
            if (flagsObj == null) {
                flagsObj = obj;
            }

            for (String key : flagCache.keySet()) {
                if (flagsObj.has(key)) {
                    flagCache.put(key, flagsObj.getBoolean(key));
                }
            }

            SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                .putString(KEY_FLAGS_JSON, jsonPayload)
                .putString(KEY_ETAG, etag)
                .putLong(KEY_LAST_FETCH, System.currentTimeMillis())
                .apply();
        } catch (Exception e) {
            // Keep existing cache on parse failure
        }
    }

    public static synchronized String getCachedEtag(Context context) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_ETAG, null);
    }

    public static synchronized boolean isCacheStale(Context context) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        long lastFetch = prefs.getLong(KEY_LAST_FETCH, 0);
        return (System.currentTimeMillis() - lastFetch) > CACHE_TTL_MS;
    }

    public static synchronized void resetDefaults() {
        loadCompiledDefaults();
    }
}
