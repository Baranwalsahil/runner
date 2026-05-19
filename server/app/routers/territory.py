from __future__ import annotations

from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps import get_current_user, get_db_pool
from app.schemas.auth import User
from app.schemas.territory import Bounds, CellOut, TerritoryStats
from app.services import territory_service

router = APIRouter(prefix="/territory", tags=["territory"])


@router.get("", response_model=list[CellOut])
async def list_cells(
    bounds: str = Query(..., description="sw_lat,sw_lng,ne_lat,ne_lng"),
    pool: asyncpg.Pool = Depends(get_db_pool),
    _: User = Depends(get_current_user),
) -> list[CellOut]:
    try:
        parsed = Bounds.parse_csv(bounds)
    except ValueError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e))
    return await territory_service.cells_in_bounds(pool, parsed)


@router.get("/stats", response_model=TerritoryStats)
async def get_stats(
    pool: asyncpg.Pool = Depends(get_db_pool),
    _: User = Depends(get_current_user),
) -> TerritoryStats:
    return await territory_service.stats(pool)


@router.get("/user/{user_id}", response_model=list[CellOut])
async def cells_for_user(
    user_id: UUID,
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    pool: asyncpg.Pool = Depends(get_db_pool),
    _: User = Depends(get_current_user),
) -> list[CellOut]:
    return await territory_service.cells_for_user(pool, user_id, limit, offset)
