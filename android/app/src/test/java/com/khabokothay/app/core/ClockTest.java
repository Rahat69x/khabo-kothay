package com.khabokothay.app.core;

import org.junit.Test;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import static org.junit.Assert.*;

public class ClockTest {
    @Test
    public void testFakeClockTimeManipulation() {
        ZonedDateTime initial = ZonedDateTime.of(2026, 10, 11, 14, 0, 0, 0, ZoneId.of("Asia/Dhaka"));
        Clock.FakeClock fakeClock = new Clock.FakeClock(initial);
        assertEquals(14, fakeClock.now().getHour());

        ZonedDateTime updated = ZonedDateTime.of(2026, 10, 11, 23, 30, 0, 0, ZoneId.of("Asia/Dhaka"));
        fakeClock.setTime(updated);
        assertEquals(23, fakeClock.now().getHour());
        assertEquals(30, fakeClock.now().getMinute());
    }
}
