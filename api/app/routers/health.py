"""Health Check Router for Khabo Kothay? API."""

from fastapi import APIRouter
from pydantic import BaseModel

from ..core.clock import get_clock
from ..core.config import settings

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    ok: bool
    status: str
    app: str
    version: str
    timestamp: str
    timezone: str


@router.get("/health", response_model=HealthResponse)
async def get_health():
    clock = get_clock()
    return HealthResponse(
        ok=True,
        status="ok",
        app=settings.app_name,
        version=settings.version,
        timestamp=clock.now().isoformat(),
        timezone=settings.timezone,
    )
