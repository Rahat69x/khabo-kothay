package com.khabokothay.app.core;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import java.net.URI;
import java.util.Arrays;
import java.util.List;

/**
 * F1: Update Checker & External Download Manager.
 * Complies with Section 4: strictly uses external browser downloads (NO in-app installer,
 * NO REQUEST_INSTALL_PACKAGES permission).
 */
public final class UpdateChecker {
    public enum UpdateType {
        NO_UPDATE,
        SOFT_UPDATE,
        FORCED_UPDATE
    }

    private static final String PREF_NAME = "khabo_update_prefs";
    private static final String KEY_DISMISSED_VERSION = "dismissed_version_code";
    private static final String KEY_DISMISSED_TIME = "dismissed_time_ms";
    private static final long SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000L; // 24 Hours

    private static final List<String> APPROVED_HOSTS = Arrays.asList(
        "github.com",
        "raw.githubusercontent.com",
        "objects.githubusercontent.com",
        "khabokothay.com",
        "api.khabokothay.com",
        "khabo-kothay-backend.onrender.com"
    );

    private UpdateChecker() {}

    /**
     * Determine update requirement based strictly on integer version codes
     */
    public static UpdateType evaluateUpdate(int installedVersionCode, int latestVersionCode, int minimumSupportedVersionCode) {
        if (installedVersionCode < minimumSupportedVersionCode) {
            return UpdateType.FORCED_UPDATE;
        }
        if (installedVersionCode < latestVersionCode) {
            return UpdateType.SOFT_UPDATE;
        }
        return UpdateType.NO_UPDATE;
    }

    /**
     * Check if soft update prompt is currently snoozed
     */
    public static boolean isSoftUpdateSnoozed(Context context, int latestVersionCode) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        int dismissedVersion = prefs.getInt(KEY_DISMISSED_VERSION, -1);
        long dismissedTime = prefs.getLong(KEY_DISMISSED_TIME, 0);

        if (dismissedVersion == latestVersionCode) {
            return (System.currentTimeMillis() - dismissedTime) < SNOOZE_DURATION_MS;
        }
        return false;
    }

    /**
     * Record soft update snooze
     */
    public static void snoozeSoftUpdate(Context context, int latestVersionCode) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putInt(KEY_DISMISSED_VERSION, latestVersionCode)
            .putLong(KEY_DISMISSED_TIME, System.currentTimeMillis())
            .apply();
    }

    /**
     * Validate download URL against approved HTTPS hosts
     */
    public static boolean isApprovedDownloadUrl(String url) {
        if (url == null || url.trim().isEmpty()) return false;
        try {
            URI uri = new URI(url);
            if (!"https".equalsIgnoreCase(uri.getScheme())) return false;
            String host = uri.getHost();
            if (host == null) return false;
            host = host.toLowerCase();

            for (String approved : APPROVED_HOSTS) {
                if (host.equals(approved) || host.endsWith("." + approved)) {
                    return true;
                }
            }
        } catch (Exception e) {
            return false;
        }
        return false;
    }

    /**
     * Open verified download URL in external browser
     */
    public static boolean launchExternalDownload(Context context, String downloadUrl) {
        if (!isApprovedDownloadUrl(downloadUrl)) {
            return false;
        }
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(downloadUrl));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
