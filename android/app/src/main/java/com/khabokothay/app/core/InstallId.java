package com.khabokothay.app.core;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.UUID;

/**
 * Generates and persists a random installation UUID on first launch.
 * Not linked to user identity, resets only on app reinstallation.
 * Complies with Section 3 and Privacy Matrix.
 */
public final class InstallId {
    private static final String PREF_NAME = "khabo_install_prefs";
    private static final String KEY_INSTALL_ID = "install_id";
    private static String cachedInstallId = null;

    private InstallId() {}

    public static synchronized String get(Context context) {
        if (cachedInstallId != null) {
            return cachedInstallId;
        }

        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String id = prefs.getString(KEY_INSTALL_ID, null);

        if (id == null || id.trim().isEmpty()) {
            id = UUID.randomUUID().toString();
            prefs.edit().putString(KEY_INSTALL_ID, id).apply();
        }

        cachedInstallId = id;
        return cachedInstallId;
    }

    public static synchronized void resetForTesting() {
        cachedInstallId = null;
    }
}
