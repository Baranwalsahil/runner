from __future__ import annotations

from datetime import datetime
from uuid import UUID

import re

from pydantic import BaseModel, EmailStr, Field, field_validator

_HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


class SignupRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)
    color: str | None = None

    @field_validator("username")
    @classmethod
    def _username_chars(cls, v: str) -> str:
        if not all(c.isalnum() or c in "-_" for c in v):
            raise ValueError("username must be alphanumeric, dash, or underscore")
        return v

    @field_validator("color")
    @classmethod
    def _color_hex(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not _HEX_COLOR_RE.match(v):
            raise ValueError("color must be a hex string like #rrggbb")
        return v.lower()


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class User(BaseModel):
    id: UUID
    email: EmailStr
    username: str
    first_name: str | None = None
    last_name: str | None = None
    avatar_url: str | None = None
    color: str | None = None
    total_cells: int = 0
    total_strength: int = 0
    total_area_m2: float = 0.0
    weight_kg: float | None = None
    goal_weight_kg: float | None = None
    height_cm: float | None = None
    age: int | None = None
    sex: str | None = None
    created_at: datetime


class AuthResponse(BaseModel):
    user: User
    token: str


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    first_name: str | None = Field(default=None, max_length=50)
    last_name: str | None = Field(default=None, max_length=50)
    weight_kg: float | None = Field(default=None, gt=0, le=500)
    goal_weight_kg: float | None = Field(default=None, gt=0, le=500)
    height_cm: float | None = Field(default=None, gt=0, le=300)
    age: int | None = Field(default=None, ge=1, le=120)
    sex: str | None = Field(default=None)

    @field_validator("username")
    @classmethod
    def _username_chars(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not all(c.isalnum() or c in "-_" for c in v):
            raise ValueError("username must be alphanumeric, dash, or underscore")
        return v

    @field_validator("sex")
    @classmethod
    def _sex_value(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if v not in {"male", "female", "other"}:
            raise ValueError("sex must be one of: male, female, other")
        return v
