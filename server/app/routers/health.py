import time

from fastapi import APIRouter, Request

from app.config import get_settings

router = APIRouter()


@router.get("/health")
async def health(request: Request) -> dict:
    settings = get_settings()
    started_at = getattr(request.app.state, "started_at", time.time())
    return {
        "status": "ok",
        "uptime": time.time() - started_at,
        "version": settings.version,
    }
