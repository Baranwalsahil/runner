from __future__ import annotations

from uuid import UUID

import asyncpg
from fastapi import Depends, Header, HTTPException, status

from app.db.pool import get_pool
from app.schemas.auth import User
from app.services import auth_service, user_service


async def get_db_pool() -> asyncpg.Pool:
    return await get_pool()


async def get_current_user(
    authorization: str | None = Header(default=None),
    pool: asyncpg.Pool = Depends(get_db_pool),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    payload = auth_service.decode_token(token)
    try:
        user_id = UUID(payload["sub"])
    except (KeyError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Malformed token claims")
    user = await user_service.get_user_by_id(pool, user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer exists")
    return user
