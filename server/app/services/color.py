from __future__ import annotations

import hashlib
from functools import lru_cache
from uuid import UUID

from app.constants import OWNER_PALETTE


@lru_cache(maxsize=10_000)
def color_for(user_id: str) -> str:
    """Deterministic palette index per user_id."""
    digest = hashlib.md5(user_id.encode("utf-8")).hexdigest()
    idx = int(digest[:8], 16) % len(OWNER_PALETTE)
    return OWNER_PALETTE[idx]


def color_for_uuid(user_id: UUID) -> str:
    return color_for(str(user_id))
