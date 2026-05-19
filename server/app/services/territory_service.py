from __future__ import annotations

from uuid import UUID

import asyncpg
import h3

from app.constants import H3_RESOLUTION
from app.schemas.territory import Bounds, CellOut, TerritoryStats
from app.services.color import color_for_uuid


def _candidate_cells(bounds: Bounds, resolution: int) -> list[str]:
    poly = h3.LatLngPoly(
        [
            (bounds.sw_lat, bounds.sw_lng),
            (bounds.sw_lat, bounds.ne_lng),
            (bounds.ne_lat, bounds.ne_lng),
            (bounds.ne_lat, bounds.sw_lng),
        ]
    )
    return list(h3.h3shape_to_cells(poly, resolution))


def _row_to_cell(row: asyncpg.Record) -> CellOut:
    uid: UUID | None = row["user_id"]
    return CellOut(
        h3_index=row["h3_index"],
        user_id=uid,
        username=row["username"],
        color=color_for_uuid(uid) if uid is not None else None,
        resolution=row["resolution"],
        claim_count=row["claim_count"],
        claimed_at=row["claimed_at"],
    )


async def cells_in_bounds(pool: asyncpg.Pool, bounds: Bounds) -> list[CellOut]:
    candidates = _candidate_cells(bounds, H3_RESOLUTION)
    if not candidates:
        return []
    rows = await pool.fetch(
        """
        SELECT c.h3_index, c.user_id, c.resolution, c.claim_count, c.claimed_at,
               u.username
        FROM claimed_cells c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE c.h3_index = ANY($1::text[])
        """,
        candidates,
    )
    return [_row_to_cell(r) for r in rows]


async def cells_for_user(
    pool: asyncpg.Pool,
    user_id: UUID,
    limit: int = 200,
    offset: int = 0,
) -> list[CellOut]:
    rows = await pool.fetch(
        """
        SELECT c.h3_index, c.user_id, c.resolution, c.claim_count, c.claimed_at,
               u.username
        FROM claimed_cells c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE c.user_id = $1
        ORDER BY c.claimed_at DESC
        LIMIT $2 OFFSET $3
        """,
        user_id,
        limit,
        offset,
    )
    return [_row_to_cell(r) for r in rows]


async def stats(pool: asyncpg.Pool) -> TerritoryStats:
    row = await pool.fetchrow(
        """
        SELECT
          COUNT(*) AS total_cells,
          COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS total_users,
          COUNT(*) FILTER (WHERE claim_count > 1) AS contested
        FROM claimed_cells
        """
    )
    return TerritoryStats(
        total_cells=row["total_cells"] if row else 0,
        total_users=row["total_users"] if row else 0,
        contested_cells=row["contested"] if row else 0,
    )
