package com.khabokothay.app.core;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.regex.Pattern;

/**
 * F11: Pay-Me Line in Bill Split.
 * Validates Bangladesh mobile phone format (bKash/Nagad).
 * Stored STRICTLY on device in private storage. Never transmitted over the network (Section 14).
 */
public final class PayMeLineHelper {
    private static final String PREF_NAME = "khabo_payme_prefs";
    private static final String KEY_WALLET_NUMBER = "wallet_mobile_number";
    private static final String KEY_WALLET_PROVIDER = "wallet_provider"; // bKash, Nagad

    private static final Pattern BD_PHONE_PATTERN = Pattern.compile("^(?:\\+?88)?01[3-9]\\d{8}$");

    private PayMeLineHelper() {}

    public static boolean isValidBangladeshMobile(String number) {
        if (number == null) return false;
        String clean = number.replaceAll("[\\s\\-]", "");
        return BD_PHONE_PATTERN.matcher(clean).matches();
    }

    public static String normalizeNumber(String number) {
        if (number == null) return "";
        String clean = number.replaceAll("[\\s\\-]", "");
        if (clean.startsWith("+880")) clean = clean.substring(3);
        else if (clean.startsWith("880")) clean = clean.substring(2);
        return clean;
    }

    public static void saveWalletInfo(Context context, String provider, String number) {
        if (!isValidBangladeshMobile(number)) {
            throw new IllegalArgumentException("Invalid Bangladesh mobile number format");
        }
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putString(KEY_WALLET_PROVIDER, provider != null ? provider : "bKash")
            .putString(KEY_WALLET_NUMBER, normalizeNumber(number))
            .apply();
    }

    public static String getSavedNumber(Context context) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_WALLET_NUMBER, null);
    }

    public static String getSavedProvider(Context context) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_WALLET_PROVIDER, "bKash");
    }

    public static void clearWalletInfo(Context context) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().clear().apply();
    }

    public static String formatPayMeLine(String provider, String number, int shareAmountBdt) {
        String num = normalizeNumber(number);
        String amountBn = BengaliFormatter.toBengaliDigits(String.valueOf(shareAmountBdt));
        return "আপনার অংশ (৳" + amountBn + ") পাঠিয়ে দিন " + provider + ": " + num + " নম্বরে।\n(Please send your share to " + provider + ": " + num + ")";
    }
}
