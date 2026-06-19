from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.constants import MAX_RUN_HOURS


class Point(BaseModel):
    lat: float = Field(ge=-90.0, le=90.0)
    lng: float = Field(ge=-180.0, le=180.0)
    timestamp: datetime | None = None
    accuracy: float | None = Field(default=None, ge=0.0)
    alt: float | None = None  # device altitude, metres (WGS84); often null


class RunCreate(BaseModel):
    gps_trace: list[Point] = Field(min_length=2)
    started_at: datetime
    ended_at: datetime

    @model_validator(mode="after")
    def _check_bounds(self) -> "RunCreate":
        if self.ended_at <= self.started_at:
            raise ValueError("ended_at must be after started_at")
        duration_h = (self.ended_at - self.started_at).total_seconds() / 3600.0
        if duration_h > MAX_RUN_HOURS:
            raise ValueError(f"run duration exceeds {MAX_RUN_HOURS}h")
        return self


class RunResult(BaseModel):
    run_id: UUID
    cells_claimed: int
    new_total: int


class RunSummary(BaseModel):
    id: UUID
    started_at: datetime
    ended_at: datetime | None
    distance_meters: float | None
    avg_elevation_m: float | None
    cells_claimed: int
    created_at: datetime


class TracePoint(BaseModel):
    lat: float
    lng: float


class RunDetail(BaseModel):
    id: UUID
    started_at: datetime
    ended_at: datetime | None
    distance_meters: float | None
    avg_elevation_m: float | None
    cells_claimed: int
    created_at: datetime
    trace: list[TracePoint]
    cells: list[str]  # H3 cell indices claimed by this run


class RunFeedItem(BaseModel):
    id: str
    type: str          # "gained" | "lost" | "defended"
    label: str
    time: str          # human-readable relative time, e.g. "2m ago"
    title: str
    subject_label: str
    user: str          # "@username"
    accent: bool
    challengeable: bool
