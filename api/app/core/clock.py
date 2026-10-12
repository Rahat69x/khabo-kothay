"""Timezone-aware clock abstraction for Khabo Kothay? API."""

from abc import ABC, abstractmethod
from datetime import datetime
from zoneinfo import ZoneInfo

DHAKA_TZ = ZoneInfo("Asia/Dhaka")


class Clock(ABC):
    @abstractmethod
    def now(self) -> datetime:
        """Return the current time in Asia/Dhaka."""


class SystemClock(Clock):
    def now(self) -> datetime:
        return datetime.now(DHAKA_TZ)


class FakeClock(Clock):
    def __init__(self, fixed_time: datetime | None = None):
        self._current = fixed_time or datetime(2026, 10, 11, 12, 0, 0, tzinfo=DHAKA_TZ)

    def set_time(self, new_time: datetime) -> None:
        if new_time.tzinfo is None:
            new_time = new_time.replace(tzinfo=DHAKA_TZ)
        self._current = new_time

    def now(self) -> datetime:
        return self._current


global_clock: Clock = SystemClock()


def get_clock() -> Clock:
    return global_clock


def set_clock(clock: Clock) -> None:
    global global_clock
    global_clock = clock
