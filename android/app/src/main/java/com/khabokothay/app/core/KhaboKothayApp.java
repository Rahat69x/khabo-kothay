package com.khabokothay.app.core;

import android.app.Application;

public class KhaboKothayApp extends Application {
    private static KhaboKothayApp instance;
    private Clock clock;
    private AppSettings settings;
    private NotificationHelper notificationHelper;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        clock = new Clock.SystemClock();
        settings = new AppSettings();
        notificationHelper = new NotificationHelper(clock, settings);
    }

    public static KhaboKothayApp getInstance() { return instance; }
    public Clock getClock() { return clock; }
    public AppSettings getSettings() { return settings; }
    public NotificationHelper getNotificationHelper() { return notificationHelper; }
}
