"""Territory bbox cache.

Key derived from quantized bounds (3 decimals → ~110m granularity) so
pan-zoom hits the same cache slot when the user reframes only slightly.

Value: JSON-serialized CellOut list. TTL: 10s.
"""

from __future__ import annotations

import json
from typing import Any

from app.schemas.territory import Bounds, CellOut

TTL_SECONDS = 10
KEY_PREFIX = "territory"


def bbox_key(bounds: Bounds) -> str:
    return (
        f"{KEY_PREFIX}:"
        f"{bounds.sw_lat:.3f}:{bounds.sw_lng:.3f}:"
        f"{bounds.ne_lat:.3f}:{bounds.ne_lng:.3f}"
    )


def _cell_to_jsonable(c: CellOut) -> dict[str, Any]:
    return {
        "h3_index": c.h3_index,
        "user_id": str(c.user_id) if c.user_id is not None else None,
        "username": c.username,
        "color": c.color,
        "resolution": c.resolution,
        "claim_count": c.claim_count,
        "claimed_at": c.claimed_at.isoformat() if c.claimed_at else None,
    }


async def get_bbox(cache, bounds: Bounds) -> list[CellOut] | None:
    raw = await cache.get(bbox_key(bounds))
    if raw is None:
        return None
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return None
    return [CellOut.model_validate(item) for item in payload]


async def set_bbox(cache, bounds: Bounds, cells: list[CellOut]) -> None:
    payload = json.dumps([_cell_to_jsonable(c) for c in cells])
    await cache.setex(bbox_key(bounds), TTL_SECONDS, payload)


async def flush_all(cache) -> int:
    """Delete every cached bbox entry. Returns count deleted."""
    deleted = 0
    async for key in cache.scan_iter(match=f"{KEY_PREFIX}:*"):
        if isinstance(key, bytes):
            key = key.decode()
        await cache.delete(key)
        deleted += 1
    return deleted
