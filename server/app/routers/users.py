from __future__ import annotations

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import get_current_user, get_db_pool
from app.schemas.auth import User, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.patch("/me", response_model=User)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    pool: asyncpg.Pool = Depends(get_db_pool),
) -> User:
    try:
        updated = await user_service.update_user(
            pool,
            current_user.id,
            username=body.username,
            first_name=body.first_name,
            last_name=body.last_name,
        )
    except user_service.UserAlreadyExists:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Username already taken",
        )
    if updated is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return updated
