from __future__ import annotations

from typing import Literal

import asyncpg
from fastapi import APIRouter, Depends, Query

from app.deps import get_current_user, get_db_pool
from app.schemas.auth import User
from app.schemas.leaderboard import LeaderboardPage, LeaderboardRow
from app.services import leaderboard_service

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=LeaderboardPage)
async def get_leaderboard(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    period: Literal["all", "weekly", "daily"] = Query("all"),
    pool: asyncpg.Pool = Depends(get_db_pool),
    _: User = Depends(get_current_user),
) -> LeaderboardPage:
    return await leaderboard_service.top(
        pool, limit=limit, offset=offset, period=period
    )


@router.get("/nearby", response_model=list[LeaderboardRow])
async def get_nearby(
    window: int = Query(5, ge=1, le=20),
    pool: asyncpg.Pool = Depends(get_db_pool),
    current_user: User = Depends(get_current_user),
) -> list[LeaderboardRow]:
    return await leaderboard_service.nearby(pool, current_user.id, window)
