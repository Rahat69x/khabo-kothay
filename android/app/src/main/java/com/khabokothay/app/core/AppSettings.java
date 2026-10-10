package com.khabokothay.app.core;

import java.time.LocalTime;

public class AppSettings {
    private boolean banglaDigitsEnabled = true;
    private boolean notificationsMasterEnabled = true;
    private LocalTime quietHoursStart = LocalTime.of(23, 0);
    private LocalTime quietHoursEnd = LocalTime.of(7, 0);
    private int maxDailyNotifications = 3;

    // Financial defaults
    private double defaultVatPct = 15.0;
    private double defaultServicePct = 5.0;
    private double defaultParkingFeeBdt = 0.0;

    public boolean isBanglaDigitsEnabled() { return banglaDigitsEnabled; }
    public void setBanglaDigitsEnabled(boolean enabled) { this.banglaDigitsEnabled = enabled; }

    public boolean isNotificationsMasterEnabled() { return notificationsMasterEnabled; }
    public void setNotificationsMasterEnabled(boolean enabled) { this.notificationsMasterEnabled = enabled; }

    public LocalTime getQuietHoursStart() { return quietHoursStart; }
    public LocalTime getQuietHoursEnd() { return quietHoursEnd; }

    public int getMaxDailyNotifications() { return maxDailyNotifications; }
    public void setMaxDailyNotifications(int max) { this.maxDailyNotifications = max; }

    public double getDefaultVatPct() { return defaultVatPct; }
    public double getDefaultServicePct() { return defaultServicePct; }
    public double getDefaultParkingFeeBdt() { return defaultParkingFeeBdt; }
}
