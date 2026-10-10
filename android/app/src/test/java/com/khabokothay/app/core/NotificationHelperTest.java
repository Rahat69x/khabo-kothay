package com.khabokothay.app.core;

import org.junit.Before;
import org.junit.Test;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import static org.junit.Assert.*;

public class NotificationHelperTest {
    private Clock.FakeClock fakeClock;
    private AppSettings settings;
    private NotificationHelper helper;

    @Before
    public void setUp() {
        // Active daytime: 14:00 (outside 23:00-07:00 quiet hours)
        fakeClock = new Clock.FakeClock(ZonedDateTime.of(2026, 10, 11, 14, 0, 0, 0, ZoneId.of("Asia/Dhaka")));
        settings = new AppSettings();
        helper = new NotificationHelper(fakeClock, settings);
    }

    @Test
    public void testQuietHoursRejection() {
        // Daytime: allowed
        assertTrue(helper.canSendNotification(NotificationHelper.CHANNEL_CLOSING_SOON));

        // 23:30 (Quiet hours): rejected
        fakeClock.setTime(ZonedDateTime.of(2026, 10, 11, 23, 30, 0, 0, ZoneId.of("Asia/Dhaka")));
        assertFalse(helper.canSendNotification(NotificationHelper.CHANNEL_CLOSING_SOON));

        // 06:30 (Quiet hours): rejected
        fakeClock.setTime(ZonedDateTime.of(2026, 10, 12, 6, 30, 0, 0, ZoneId.of("Asia/Dhaka")));
        assertFalse(helper.canSendNotification(NotificationHelper.CHANNEL_CLOSING_SOON));

        // 08:00 (Outside quiet hours): allowed
        fakeClock.setTime(ZonedDateTime.of(2026, 10, 12, 8, 0, 0, 0, ZoneId.of("Asia/Dhaka")));
        assertTrue(helper.canSendNotification(NotificationHelper.CHANNEL_CLOSING_SOON));
    }

    @Test
    public void testMaxDailyCapEnforcement() {
        assertEquals(0, helper.getDailyNotificationCount());
        assertTrue(helper.canSendNotification(NotificationHelper.CHANNEL_CLOSING_SOON));

        helper.recordNotificationSent();
        helper.recordNotificationSent();
        helper.recordNotificationSent();
        assertEquals(3, helper.getDailyNotificationCount());

        // 4th notification within the same day rejected by 3-per-day cap
        assertFalse(helper.canSendNotification(NotificationHelper.CHANNEL_CLOSING_SOON));

        // Next day resets count
        fakeClock.setTime(ZonedDateTime.of(2026, 10, 12, 14, 0, 0, 0, ZoneId.of("Asia/Dhaka")));
        assertTrue(helper.canSendNotification(NotificationHelper.CHANNEL_CLOSING_SOON));
    }

    @Test
    public void testMasterToggleDisablesAll() {
        settings.setNotificationsMasterEnabled(false);
        assertFalse(helper.canSendNotification(NotificationHelper.CHANNEL_CLOSING_SOON));
        assertFalse(helper.canSendNotification(NotificationHelper.CHANNEL_BUDGET));
    }
}
