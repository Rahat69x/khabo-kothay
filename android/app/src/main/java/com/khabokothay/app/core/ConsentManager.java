package com.khabokothay.app.core;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * F15: Diagnostic Consent Manager.
 * Complies with Section 18.1: crash collection is disabled until explicit opt-in.
 * Withdrawal is immediately honored and stops all uploads.
 */
public final class ConsentManager {
    private static final String PREF_NAME = "khabo_consent_prefs";
    private static final String KEY_CRASH_CONSENT = "consent_crash_reporting";
    private static final String KEY_CONSENT_TIMESTAMP = "consent_timestamp_ms";
    private static final String CONSENT_TEXT_VERSION = "1.0";

    private ConsentManager() {}

    public static boolean isCrashReportingConsented(Context context) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        return prefs.getBoolean(KEY_CRASH_CONSENT, false);
    }

    public static void setCrashReportingConsent(Context context, boolean granted) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putBoolean(KEY_CRASH_CONSENT, granted)
            .putLong(KEY_CONSENT_TIMESTAMP, System.currentTimeMillis())
            .apply();
    }

    public static String getConsentTextVersion() {
        return CONSENT_TEXT_VERSION;
    }
}
