from __future__ import annotations

from collections import Counter
from uuid import uuid4

from app.constants import OWNER_PALETTE
from app.services.color import color_for, color_for_uuid


def test_deterministic_same_input():
    uid = "11111111-1111-1111-1111-111111111111"
    assert color_for(uid) == color_for(uid)


def test_color_in_palette():
    for _ in range(50):
        c = color_for(str(uuid4()))
        assert c in OWNER_PALETTE


def test_color_for_uuid_wrapper():
    u = uuid4()
    assert color_for_uuid(u) == color_for(str(u))


def test_distribution_roughly_uniform():
    n = 1200
    counts = Counter(color_for(str(uuid4())) for _ in range(n))
    expected = n / len(OWNER_PALETTE)
    for c in OWNER_PALETTE:
        # Each bucket should be within 50% of expected — generous bound.
        assert expected * 0.5 < counts[c] < expected * 1.5, counts
