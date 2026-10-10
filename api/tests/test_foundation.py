"""Tests for Phase F Shared Foundation (FastAPI)."""
from datetime import datetime
from zoneinfo import ZoneInfo
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.clock import FakeClock, set_clock, get_clock, DHAKA_TZ
from app.core.config import settings
from app.core.guard import usage_guard

@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert data["status"] == "ok"
        assert data["timezone"] == "Asia/Dhaka"
        assert "X-Request-Id" in resp.headers

@pytest.mark.asyncio
async def test_fake_clock_isolation():
    fixed = datetime(2026, 10, 11, 15, 30, 0, tzinfo=DHAKA_TZ)
    fake = FakeClock(fixed)
    set_clock(fake)
    assert get_clock().now() == fixed
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/health")
        assert resp.status_code == 200
        assert "2026-10-11T15:30:00" in resp.json()["timestamp"]

def test_usage_guard_limits():
    usage_guard.reset()
    device = "test-device-123"
    assert usage_guard.record_google_call() is True
    assert usage_guard.check_device_limit(device) is True
    stats = usage_guard.get_stats()
    assert stats["daily_google_calls"] == 1
    assert stats["tracked_devices"] == 1

def test_feature_flags_exist():
    assert hasattr(settings, "flag_outing_cost")
    assert hasattr(settings, "flag_closing_alerts")
    assert hasattr(settings, "flag_budget_tracker")
    assert hasattr(settings, "flag_occasion_filters")
    assert hasattr(settings, "flag_home_widget")
    assert hasattr(settings, "flag_parking_access")
    assert hasattr(settings, "flag_hidden_gems")
    assert hasattr(settings, "flag_seasonal_guides")
    assert hasattr(settings, "flag_dish_search")
    assert hasattr(settings, "flag_want_to_try")
    assert hasattr(settings, "flag_geofence_reminders")
