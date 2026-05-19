from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class Bounds(BaseModel):
    sw_lat: float = Field(ge=-90.0, le=90.0)
    sw_lng: float = Field(ge=-180.0, le=180.0)
    ne_lat: float = Field(ge=-90.0, le=90.0)
    ne_lng: float = Field(ge=-180.0, le=180.0)

    @classmethod
    def parse_csv(cls, raw: str) -> "Bounds":
        parts = raw.split(",")
        if len(parts) != 4:
            raise ValueError(
                "bounds must be 'sw_lat,sw_lng,ne_lat,ne_lng'"
            )
        try:
            sw_lat, sw_lng, ne_lat, ne_lng = (float(p) for p in parts)
        except ValueError as e:
            raise ValueError(f"bounds parse error: {e}") from e
        if sw_lat > ne_lat or sw_lng > ne_lng:
            raise ValueError("bounds: sw corner must be < ne corner")
        return cls(sw_lat=sw_lat, sw_lng=sw_lng, ne_lat=ne_lat, ne_lng=ne_lng)


class CellOut(BaseModel):
    h3_index: str
    user_id: UUID | None
    username: str | None
    color: str | None
    resolution: int
    claim_count: int
    claimed_at: datetime


class TerritoryStats(BaseModel):
    total_cells: int
    total_users: int
    contested_cells: int  # claim_count > 1
