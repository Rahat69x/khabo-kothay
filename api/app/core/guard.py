"""Usage Guard and Request Counter for Khabo Kothay? API."""
from threading import Lock
from .config import settings

class UsageGuard:
    def __init__(self):
        self._lock = Lock()
        self._daily_google_calls = 0
        self._device_counts = {}

    def record_google_call(self) -> bool:
        with self._lock:
            if self._daily_google_calls >= settings.daily_google_request_cap:
                return False
            self._daily_google_calls += 1
            return True

    def check_device_limit(self, device_id: str) -> bool:
        with self._lock:
            current = self._device_counts.get(device_id, 0)
            if current >= settings.device_daily_search_limit:
                return False
            self._device_counts[device_id] = current + 1
            return True

    def get_stats(self) -> dict:
        with self._lock:
            return {
                "daily_google_calls": self._daily_google_calls,
                "cap": settings.daily_google_request_cap,
                "tracked_devices": len(self._device_counts)
            }

    def reset(self) -> None:
        with self._lock:
            self._daily_google_calls = 0
            self._device_counts.clear()

usage_guard = UsageGuard()
