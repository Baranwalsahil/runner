from __future__ import annotations

from collections.abc import Iterable

import h3


def trace_to_cells(
    points: Iterable[tuple[float, float]],
    resolution: int,
) -> set[str]:
    """Map (lat, lng) points to a deduped set of H3 cell indices.

    Empty input yields an empty set.
    """
    return {h3.latlng_to_cell(lat, lng, resolution) for lat, lng in points}
