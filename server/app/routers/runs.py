from __future__ import annotations

from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import get_cache_client, get_current_user, get_db_pool
from app.schemas.auth import User
from app.schemas.run import RunCreate, RunFeedItem, RunResult, RunSummary
from app.services import run_service

router = APIRouter(prefix="/runs", tags=["runs"])


@router.post("", response_model=RunResult, status_code=status.HTTP_201_CREATED)
async def submit_run(
    payload: RunCreate,
    pool: asyncpg.Pool = Depends(get_db_pool),
    cache=Depends(get_cache_client),
    current_user: User = Depends(get_current_user),
) -> RunResult:
    return await run_service.ingest_run(pool, current_user.id, payload, cache)


@router.get("", response_model=list[RunSummary])
async def list_runs(
    pool: asyncpg.Pool = Depends(get_db_pool),
    current_user: User = Depends(get_current_user),
) -> list[RunSummary]:
    return await run_service.list_runs(pool, current_user.id)


@router.get("/feed", response_model=list[RunFeedItem])
async def get_runs_feed(
    limit: int = 12,
    pool: asyncpg.Pool = Depends(get_db_pool),
    current_user: User = Depends(get_current_user),
) -> list[RunFeedItem]:
    return await run_service.feed_runs(pool, current_user.id, limit=min(limit, 50))


@router.get("/{run_id}", response_model=RunSummary)
async def get_run(
    run_id: UUID,
    pool: asyncpg.Pool = Depends(get_db_pool),
    current_user: User = Depends(get_current_user),
) -> RunSummary:
    summary = await run_service.get_run(pool, current_user.id, run_id)
    if summary is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "run not found")
    return summary
