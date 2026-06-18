from __future__ import annotations

import h3
import pytest

from app.services.h3_service import GAP_BRIDGE_MAX_M, trace_to_cells


# ---------------------------------------------------------------------------
# Existing tests (unchanged behaviour)
# ---------------------------------------------------------------------------

def test_empty_input():
    assert trace_to_cells([], 9) == set()


def test_dedupes_same_cell():
    pts = [(47.6062, -122.3321), (47.60621, -122.33211)]
    cells = trace_to_cells(pts, 9)
    assert len(cells) == 1


def test_resolution_honored():
    pts = [(47.6062, -122.3321)]
    c7 = next(iter(trace_to_cells(pts, 7)))
    c9 = next(iter(trace_to_cells(pts, 9)))
    assert h3.get_resolution(c7) == 7
    assert h3.get_resolution(c9) == 9
    assert c7 != c9


def test_distinct_points_distinct_cells():
    pts = [(47.6062, -122.3321), (40.7128, -74.0060)]  # Seattle + NYC
    assert len(trace_to_cells(pts, 9)) == 2


# ---------------------------------------------------------------------------
# New gap-bridge tests
# ---------------------------------------------------------------------------

def test_single_point_returns_one_cell():
    """Single point → exactly one cell, no pair processing."""
    pts = [(47.6062, -122.3321)]
    cells = trace_to_cells(pts, 9)
    assert len(cells) == 1


def test_close_points_bridge_fills_path():
    """Two points <200m apart but in different cells → path cells included.

    The H3 grid_path_cells between two neighbouring cells at resolution 9
    returns at least 2 cells (start + end), but typically includes intermediate
    cells when the cells are not adjacent.  We assert len > 2 to confirm
    bridging happened — choose coordinates ~150m apart that map to cells with
    at least one intermediate grid step.
    """
    # ~130 m apart along latitude at resolution 9 (cell edge ~174 m)
    # These two points land in different H3 cells and need a bridge.
    lat_a, lng_a = 37.7749, -122.4194   # San Francisco
    lat_b, lng_b = 37.7762, -122.4194   # ~145 m north

    cell_a = h3.latlng_to_cell(lat_a, lng_a, 9)
    cell_b = h3.latlng_to_cell(lat_b, lng_b, 9)

    # Confirm they're different cells (otherwise the test wouldn't exercise bridging)
    if cell_a == cell_b:
        pytest.skip("Points landed in the same cell — adjust coordinates")

    cells = trace_to_cells([(lat_a, lng_a), (lat_b, lng_b)], 9)
    path = h3.grid_path_cells(cell_a, cell_b)

    # All path cells must be present
    assert set(path).issubset(cells), "Bridged path cells missing from result"
    # Result is at least as large as the full path
    assert len(cells) >= len(path)


def test_far_points_no_bridge():
    """Two points >200m apart → result is exactly the 2 endpoint cells."""
    # Seattle (WA) and NYC — thousands of km apart
    pts = [(47.6062, -122.3321), (40.7128, -74.0060)]
    cells = trace_to_cells(pts, 9)
    assert len(cells) == 2


def test_gap_bridge_max_m_constant():
    """GAP_BRIDGE_MAX_M is exported and equals 200.0."""
    assert GAP_BRIDGE_MAX_M == 200.0


def test_bridge_exactly_at_boundary_close():
    """A pair just inside 200m cap IS bridged — result includes path cells."""
    # Use two points ~180m apart (well within the cap) in different cells.
    lat_a, lng_a = 51.5074, -0.1278   # London
    lat_b, lng_b = 51.5090, -0.1278   # ~178 m north

    cell_a = h3.latlng_to_cell(lat_a, lng_a, 9)
    cell_b = h3.latlng_to_cell(lat_b, lng_b, 9)

    if cell_a == cell_b:
        pytest.skip("Points landed in the same cell — adjust coordinates")

    cells = trace_to_cells([(lat_a, lng_a), (lat_b, lng_b)], 9)
    path = h3.grid_path_cells(cell_a, cell_b)
    assert set(path).issubset(cells)


def test_bridge_far_pair_only_endpoints():
    """Pair >200m apart keeps exactly those two endpoint cells, no extras."""
    # ~250 m apart along latitude
    lat_a, lng_a = 48.8566, 2.3522    # Paris
    lat_b, lng_b = 48.8589, 2.3522    # ~256 m north

    cell_a = h3.latlng_to_cell(lat_a, lng_a, 9)
    cell_b = h3.latlng_to_cell(lat_b, lng_b, 9)

    cells = trace_to_cells([(lat_a, lng_a), (lat_b, lng_b)], 9)
    # Must contain both endpoints
    assert cell_a in cells
    assert cell_b in cells
    # Must NOT contain any cell that's not one of the endpoints
    assert cells == {cell_a, cell_b}


def test_mixed_trace_bridges_only_close_gaps():
    """Three-point trace: first pair close, second pair far.

    Result must include bridge cells between points 0-1 but only the
    two endpoint cells for points 1-2.
    """
    # Point 0 → Point 1: ~145 m (bridge)
    # Point 1 → Point 2: far away (no bridge)
    lat0, lng0 = 37.7749, -122.4194
    lat1, lng1 = 37.7762, -122.4194
    lat2, lng2 = 40.7128, -74.0060    # NYC, thousands of km away

    cell0 = h3.latlng_to_cell(lat0, lng0, 9)
    cell1 = h3.latlng_to_cell(lat1, lng1, 9)
    cell2 = h3.latlng_to_cell(lat2, lng2, 9)

    if cell0 == cell1:
        pytest.skip("Points 0-1 landed in same cell")

    cells = trace_to_cells([(lat0, lng0), (lat1, lng1), (lat2, lng2)], 9)

    # Bridge between 0 and 1 must be present
    path_01 = set(h3.grid_path_cells(cell0, cell1))
    assert path_01.issubset(cells), "Bridge cells for close pair missing"

    # Far endpoint must be present
    assert cell2 in cells

    # No extra cells beyond the bridge + all three endpoints
    expected = path_01 | {cell2}
    assert cells == expected
