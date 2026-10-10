package com.khabokothay.app.core;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;

public class NotificationHelper {
    public static final String CHANNEL_CLOSING_SOON = "closing_soon";
    public static final String CHANNEL_BUDGET = "budget";
    public static final String CHANNEL_GUIDES = "guides";
    public static final String CHANNEL_REMINDERS = "reminders";
    public static final String CHANNEL_NEARBY = "nearby";

    private final Clock clock;
    private final AppSettings settings;
    private final Map<String, Boolean> channelToggles = new HashMap<>();
    private LocalDate lastNotificationDate;
    private int dailyNotificationCount = 0;

    public NotificationHelper(Clock clock, AppSettings settings) {
        this.clock = clock;
        this.settings = settings;
        channelToggles.put(CHANNEL_CLOSING_SOON, true);
        channelToggles.put(CHANNEL_BUDGET, true);
        channelToggles.put(CHANNEL_GUIDES, true);
        channelToggles.put(CHANNEL_REMINDERS, true);
        channelToggles.put(CHANNEL_NEARBY, true);
    }

    public boolean canSendNotification(String channel) {
        if (!settings.isNotificationsMasterEnabled()) return false;
        if (!Boolean.TRUE.equals(channelToggles.get(channel))) return false;

        ZonedDateTime now = clock.now();
        LocalTime time = now.toLocalTime();

        // Check quiet hours (e.g. 23:00 to 07:00)
        LocalTime start = settings.getQuietHoursStart();
        LocalTime end = settings.getQuietHoursEnd();
        if (start.isAfter(end)) { // Spans midnight
            if (time.isAfter(start) || time.isBefore(end)) return false;
        } else {
            if (time.isAfter(start) && time.isBefore(end)) return false;
        }

        // Daily cap enforcement (max 3 per day across all channels)
        LocalDate today = now.toLocalDate();
        if (!today.equals(lastNotificationDate)) {
            lastNotificationDate = today;
            dailyNotificationCount = 0;
        }

        return dailyNotificationCount < settings.getMaxDailyNotifications();
    }

    public void recordNotificationSent() {
        dailyNotificationCount++;
    }

    public int getDailyNotificationCount() {
        return dailyNotificationCount;
    }
}
