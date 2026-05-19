from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel


class LeaderboardRow(BaseModel):
    user_id: UUID
    username: str
    total_cells: int
    rank: int
    color: str


class LeaderboardPage(BaseModel):
    rows: list[LeaderboardRow]
    total: int
    limit: int
    offset: int
