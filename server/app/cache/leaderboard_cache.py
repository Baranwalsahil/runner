"""Leaderboard ZSET cache.

Layout:
  key:    "leaderboard:global"
  member: user_id (UUID string)
  score:  total_cells (float)

Read order: cache → DB hydration of user rows by ID.
"""

from __future__ import annotations

from uuid import UUID

KEY_GLOBAL = "leaderboard:global"


async def upsert_user_total(cache, user_id: UUID, total_cells: int) -> None:
    """Set a user's score (idempotent)."""
    await cache.zadd(KEY_GLOBAL, {str(user_id): float(total_cells)})


async def top_ids(cache, limit: int, offset: int) -> list[tuple[str, int]]:
    """Returns [(user_id, total_cells), ...] sorted DESC. Empty when cache miss."""
    start = offset
    end = offset + limit - 1
    raw = await cache.zrevrange(KEY_GLOBAL, start, end, withscores=True)
    out: list[tuple[str, int]] = []
    for member, score in raw:
        # decode_responses=True → str; fakeredis returns bytes sometimes
        if isinstance(member, bytes):
            member = member.decode()
        out.append((member, int(score)))
    return out


async def total_users(cache) -> int:
    return int(await cache.zcard(KEY_GLOBAL))
