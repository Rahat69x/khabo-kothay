package com.khabokothay.app.core;

import java.time.ZoneId;
import java.time.ZonedDateTime;

public interface Clock {
    ZoneId DHAKA_ZONE = ZoneId.of("Asia/Dhaka");

    ZonedDateTime now();

    class SystemClock implements Clock {
        @Override
        public ZonedDateTime now() {
            return ZonedDateTime.now(DHAKA_ZONE);
        }
    }

    class FakeClock implements Clock {
        private ZonedDateTime currentTime;

        public FakeClock(ZonedDateTime initialTime) {
            this.currentTime = initialTime.withZoneSameInstant(DHAKA_ZONE);
        }

        public void setTime(ZonedDateTime newTime) {
            this.currentTime = newTime.withZoneSameInstant(DHAKA_ZONE);
        }

        @Override
        public ZonedDateTime now() {
            return currentTime;
        }
    }
}
