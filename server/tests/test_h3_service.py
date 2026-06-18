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
# Gap-bridge tests
# ---------------------------------------------------------------------------

def test_single_point_returns_one_cell():
    """Single point -> exactly one cell, no pair processing."""
    pts = [(47.6062, -122.3321)]
    cells = trace_to_cells(pts, 9)
    assert len(cells) == 1


def test_close_points_bridge_fills_path():
    """Two points <1000m apart but in different cells -> path cells included.

    The H3 grid_path_cells between two cells at resolution 9 returns at least
    the start and end cells; when there are intermediate cells the path is
    longer.  We verify that all path cells are present in the result.
    """
    # ~145 m apart along latitude — well inside the 1000 m cap
    lat_a, lng_a = 37.7749, -122.4194   # San Francisco
    lat_b, lng_b = 37.7762, -122.4194   # ~145 m north

    cell_a = h3.latlng_to_cell(lat_a, lng_a, 9)
    cell_b = h3.latlng_to_cell(lat_b, lng_b, 9)

    # Confirm they're different cells (otherwise bridging is trivial)
    if cell_a == cell_b:
        pytest.skip("Points landed in the same cell — adjust coordinates")

    cells = trace_to_cells([(lat_a, lng_a), (lat_b, lng_b)], 9)
    path = h3.grid_path_cells(cell_a, cell_b)

    # All path cells must be present
    assert set(path).issubset(cells), "Bridged path cells missing from result"
    # Result is at least as large as the full path
    assert len(cells) >= len(path)


def test_far_points_no_bridge():
    """Two points >1000m apart -> result is exactly the 2 endpoint cells."""
    # Seattle (WA) and NYC — thousands of km apart
    pts = [(47.6062, -122.3321), (40.7128, -74.0060)]
    cells = trace_to_cells(pts, 9)
    assert len(cells) == 2


def test_gap_bridge_max_m_constant():
    """GAP_BRIDGE_MAX_M is exported and equals 1000.0."""
    assert GAP_BRIDGE_MAX_M == 1000.0


def test_bridge_exactly_at_boundary_close():
    """A pair well inside the 1000m cap IS bridged — result includes path cells."""
    # ~178 m north of London — well within the 1000 m cap
    lat_a, lng_a = 51.5074, -0.1278
    lat_b, lng_b = 51.5090, -0.1278   # ~178 m north

    cell_a = h3.latlng_to_cell(lat_a, lng_a, 9)
    cell_b = h3.latlng_to_cell(lat_b, lng_b, 9)

    if cell_a == cell_b:
        pytest.skip("Points landed in the same cell — adjust coordinates")

    cells = trace_to_cells([(lat_a, lng_a), (lat_b, lng_b)], 9)
    path = h3.grid_path_cells(cell_a, cell_b)
    assert set(path).issubset(cells)


def test_bridge_just_under_1000m():
    """A pair just under 1000m apart IS bridged."""
    # ~900 m apart along latitude in San Francisco area
    lat_a, lng_a = 37.7749, -122.4194
    lat_b, lng_b = 37.7830, -122.4194   # ~900 m north

    cell_a = h3.latlng_to_cell(lat_a, lng_a, 9)
    cell_b = h3.latlng_to_cell(lat_b, lng_b, 9)

    if cell_a == cell_b:
        pytest.skip("Points landed in the same cell")

    cells = trace_to_cells([(lat_a, lng_a), (lat_b, lng_b)], 9)
    path = h3.grid_path_cells(cell_a, cell_b)
    assert set(path).issubset(cells), "Bridge cells missing for <1000m pair"


def test_bridge_far_pair_only_endpoints():
    """Pair >1000m apart keeps exactly those two endpoint cells, no extras."""
    # ~1.5 km apart along latitude in Paris area
    lat_a, lng_a = 48.8566, 2.3522    # Paris
    lat_b, lng_b = 48.8701, 2.3522    # ~1500 m north

    cell_a = h3.latlng_to_cell(lat_a, lng_a, 9)
    cell_b = h3.latlng_to_cell(lat_b, lng_b, 9)

    cells = trace_to_cells([(lat_a, lng_a), (lat_b, lng_b)], 9)
    # Must contain both endpoints
    assert cell_a in cells
    assert cell_b in cells
    # Must NOT contain any extra cells beyond the two endpoints
    assert cells == {cell_a, cell_b}


def test_mixed_trace_bridges_only_close_gaps():
    """Three-point trace: first pair close (<1000m), second pair far (>1000m).

    Result must include bridge cells between points 0-1 but only the
    two endpoint cells for points 1-2.
    """
    # Point 0 -> Point 1: ~145 m (bridge)
    # Point 1 -> Point 2: far away (no bridge)
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
