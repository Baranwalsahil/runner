from __future__ import annotations

from typing import Literal
from uuid import UUID

import asyncpg

from app.schemas.leaderboard import LeaderboardPage, LeaderboardRow
from app.services.color import color_for_uuid

Period = Literal["all", "weekly", "daily"]


def _row_to_lb(row: asyncpg.Record) -> LeaderboardRow:
    uid: UUID = row["user_id"]
    return LeaderboardRow(
        user_id=uid,
        username=row["username"],
        total_cells=row["total_cells"],
        rank=row["rank"],
        color=color_for_uuid(uid),
    )


async def top(
    pool: asyncpg.Pool,
    *,
    limit: int = 50,
    offset: int = 0,
    period: Period = "all",
) -> LeaderboardPage:
    if period == "all":
        rows = await pool.fetch(
            """
            SELECT user_id, username, total_cells, rank
            FROM (
              SELECT id AS user_id, username, total_cells,
                     ROW_NUMBER() OVER (ORDER BY total_cells DESC, username ASC) AS rank
              FROM users
            ) ranked
            ORDER BY rank
            LIMIT $1 OFFSET $2
            """,
            limit,
            offset,
        )
        total_row = await pool.fetchrow("SELECT COUNT(*) AS n FROM users")
    else:
        # Period-bound: claim count within window.
        interval = "7 days" if period == "weekly" else "1 day"
        rows = await pool.fetch(
            f"""
            WITH recent AS (
              SELECT user_id, COUNT(*) AS recent_cells
              FROM claimed_cells
              WHERE user_id IS NOT NULL
                AND claimed_at > NOW() - INTERVAL '{interval}'
              GROUP BY user_id
            )
            SELECT u.id AS user_id, u.username, r.recent_cells AS total_cells,
                   ROW_NUMBER() OVER (ORDER BY r.recent_cells DESC, u.username ASC) AS rank
            FROM recent r
            JOIN users u ON u.id = r.user_id
            ORDER BY rank
            LIMIT $1 OFFSET $2
            """,
            limit,
            offset,
        )
        total_row = await pool.fetchrow(
            f"""
            SELECT COUNT(DISTINCT user_id) AS n
            FROM claimed_cells
            WHERE user_id IS NOT NULL
              AND claimed_at > NOW() - INTERVAL '{interval}'
            """
        )

    total = total_row["n"] if total_row else 0
    return LeaderboardPage(
        rows=[_row_to_lb(r) for r in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


async def nearby(
    pool: asyncpg.Pool, user_id: UUID, window: int = 5
) -> list[LeaderboardRow]:
    rows = await pool.fetch(
        """
        WITH ranked AS (
          SELECT id AS user_id, username, total_cells,
                 ROW_NUMBER() OVER (ORDER BY total_cells DESC, username ASC) AS rank
          FROM users
        ),
        me AS (
          SELECT rank FROM ranked WHERE user_id = $1
        )
        SELECT ranked.user_id, ranked.username, ranked.total_cells, ranked.rank
        FROM ranked, me
        WHERE ABS(ranked.rank - me.rank) <= $2
        ORDER BY ranked.rank
        """,
        user_id,
        window,
    )
    return [_row_to_lb(r) for r in rows]
