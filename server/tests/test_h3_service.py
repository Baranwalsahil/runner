from __future__ import annotations

import h3

from app.services.h3_service import trace_to_cells


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
