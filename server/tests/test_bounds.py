from __future__ import annotations

import pytest

from app.schemas.territory import Bounds


def test_parse_csv_valid():
    b = Bounds.parse_csv("47.6,-122.34,47.62,-122.32")
    assert b.sw_lat == 47.6
    assert b.ne_lng == -122.32


def test_parse_csv_wrong_count():
    with pytest.raises(ValueError):
        Bounds.parse_csv("1,2,3")


def test_parse_csv_bad_floats():
    with pytest.raises(ValueError):
        Bounds.parse_csv("a,b,c,d")


def test_parse_csv_inverted_corners():
    # sw_lat > ne_lat → reject
    with pytest.raises(ValueError):
        Bounds.parse_csv("47.62,-122.34,47.6,-122.32")


def test_lat_out_of_range_caught_by_pydantic():
    with pytest.raises(Exception):
        Bounds(sw_lat=100, sw_lng=0, ne_lat=101, ne_lng=1)
