from __future__ import annotations

from collections.abc import Iterable

import h3

from app.services.gps_filter import haversine_m

# Maximum great-circle distance (metres) between two consecutive trace points
# for which we fill the H3 cells along the straight line between them.
# Gaps wider than this are treated as GPS teleports/spoofs and are NOT bridged
# (both endpoint cells are still claimed).
GAP_BRIDGE_MAX_M = 200.0


def trace_to_cells(
    points: Iterable[tuple[float, float]],
    resolution: int,
) -> set[str]:
    """Map (lat, lng) points to a deduped set of H3 cell indices.

    For each consecutive pair of points whose great-circle distance is
    <= GAP_BRIDGE_MAX_M, all H3 cells along the grid path between the two
    endpoint cells are included (fills gaps caused by weak GPS signal).
    Pairs further apart than the cap are skipped for bridging to avoid
    claiming cells across GPS-teleport jumps; their endpoint cells are still
    included.

    Empty input yields an empty set.
    """
    pts = list(points)
    if not pts:
        return set()

    cells: set[str] = set()

    # Always claim every point's own cell.
    point_cells = [h3.latlng_to_cell(lat, lng, resolution) for lat, lng in pts]
    cells.update(point_cells)

    # Bridge consecutive pairs within the distance cap.
    for i in range(len(pts) - 1):
        lat_a, lng_a = pts[i]
        lat_b, lng_b = pts[i + 1]
        dist = haversine_m(lat_a, lng_a, lat_b, lng_b)
        if dist > GAP_BRIDGE_MAX_M:
            # GPS teleport / spoof — skip bridging for this pair.
            continue
        cell_a = point_cells[i]
        cell_b = point_cells[i + 1]
        try:
            path = h3.grid_path_cells(cell_a, cell_b)
            cells.update(path)
        except Exception:
            # H3GridNavigationError or similar — fall back to endpoints only.
            pass

    return cells
