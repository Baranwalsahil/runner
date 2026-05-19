from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class SignupRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def _username_chars(cls, v: str) -> str:
        if not all(c.isalnum() or c in "-_" for c in v):
            raise ValueError("username must be alphanumeric, dash, or underscore")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class User(BaseModel):
    id: UUID
    email: EmailStr
    username: str
    avatar_url: str | None = None
    total_cells: int = 0
    total_area_m2: float = 0.0
    created_at: datetime


class AuthResponse(BaseModel):
    user: User
    token: str
