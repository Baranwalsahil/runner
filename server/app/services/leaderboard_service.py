from __future__ import annotations

from typing import Literal
from uuid import UUID

import asyncpg

from app.cache import leaderboard_cache
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
        color=row["color"] or color_for_uuid(uid),
    )


async def _hydrate_users(
    pool: asyncpg.Pool, scored: list[tuple[str, int]], offset: int
) -> list[LeaderboardRow]:
    ids = [UUID(uid) for uid, _ in scored]
    rows = await pool.fetch(
        "SELECT id, username, color FROM users WHERE id = ANY($1::uuid[])",
        ids,
    )
    by_id = {row["id"]: (row["username"], row["color"]) for row in rows}
    out: list[LeaderboardRow] = []
    for uid, score in scored:
        uuid_obj = UUID(uid)
        entry = by_id.get(uuid_obj)
        if entry is None:
            continue
        username, color = entry
        out.append(
            LeaderboardRow(
                user_id=uuid_obj,
                username=username,
                total_cells=score,
                rank=offset + len(out) + 1,
                color=color or color_for_uuid(uuid_obj),
            )
        )
    return out


async def top(
    pool: asyncpg.Pool,
    *,
    limit: int = 50,
    offset: int = 0,
    period: Period = "all",
    cache=None,
) -> LeaderboardPage:
    if period == "all" and cache is not None:
        scored = await leaderboard_cache.top_ids(cache, limit, offset)
        if scored:
            total = await leaderboard_cache.total_users(cache)
            rows = await _hydrate_users(pool, scored, offset)
            return LeaderboardPage(
                rows=rows, total=total, limit=limit, offset=offset
            )
    if period == "all":
        rows = await pool.fetch(
            """
            SELECT user_id, username, color, total_cells, rank
            FROM (
              SELECT id AS user_id, username, color, total_strength AS total_cells,
                     ROW_NUMBER() OVER (ORDER BY total_strength DESC, username ASC) AS rank
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
            SELECT u.id AS user_id, u.username, u.color, r.recent_cells AS total_cells,
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
          SELECT id AS user_id, username, color, total_strength AS total_cells,
                 ROW_NUMBER() OVER (ORDER BY total_strength DESC, username ASC) AS rank
          FROM users
        ),
        me AS (
          SELECT rank FROM ranked WHERE user_id = $1
        )
        SELECT ranked.user_id, ranked.username, ranked.color, ranked.total_cells, ranked.rank
        FROM ranked, me
        WHERE ABS(ranked.rank - me.rank) <= $2
        ORDER BY ranked.rank
        """,
        user_id,
        window,
    )
    return [_row_to_lb(r) for r in rows]
