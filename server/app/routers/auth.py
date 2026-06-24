from __future__ import annotations

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.deps import get_current_user, get_db_pool
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    SignupRequest,
    User,
)
from app.services import auth_service, user_service

router = APIRouter(prefix="/auth", tags=["auth"])

INVALID_CREDS = "Invalid credentials"


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
async def signup(
    body: SignupRequest,
    pool: asyncpg.Pool = Depends(get_db_pool),
) -> AuthResponse:
    password_hash = auth_service.hash_password(body.password)
    try:
        user = await user_service.create_user(
            pool,
            email=body.email.lower(),
            username=body.username,
            password_hash=password_hash,
            color=body.color,
        )
    except user_service.ColorTaken:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "That color is already taken — pick another",
        )
    except user_service.UserAlreadyExists:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Email or username already registered",
        )
    token = auth_service.issue_token(user.id, user.email)
    return AuthResponse(user=user, token=token)


@router.post("/login", response_model=AuthResponse)
async def login(
    body: LoginRequest,
    pool: asyncpg.Pool = Depends(get_db_pool),
) -> AuthResponse:
    result = await user_service.get_user_by_identifier(pool, body.identifier.lower())
    if result is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, INVALID_CREDS)
    user, password_hash = result
    if not auth_service.verify_password(body.password, password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, INVALID_CREDS)
    token = auth_service.issue_token(user.id, user.email)
    return AuthResponse(user=user, token=token)


@router.get("/me", response_model=User)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout() -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)
