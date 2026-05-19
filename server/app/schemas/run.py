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
    cells_claimed: int
    created_at: datetime
