"""Unit tests for elevation-gain computation (pure, no DB)."""

from __future__ import annotations

from types import SimpleNamespace

from app.services.run_service import _elevation_gain, MIN_GAIN_THRESHOLD_M


def _pts(*alts):
    return [SimpleNamespace(alt=a) for a in alts]


def test_elevation_gain_monotone_ascent():
    # 100 -> 150 -> 200: total rise = 100 m, well above 3 m threshold.
    assert _elevation_gain(_pts(100.0, 150.0, 200.0)) == 100.0


def test_elevation_gain_descent_not_counted():
    # 200 -> 100: pure descent, gain = 0.
    assert _elevation_gain(_pts(200.0, 100.0)) == 0.0


def test_elevation_gain_mixed():
    # 100 -> 90 -> 100: the 10 m descent then 10 m rise.
    # The 10 m rise > threshold (3 m), so gain = 10.
    assert _elevation_gain(_pts(100.0, 90.0, 100.0)) == 10.0


def test_elevation_gain_below_threshold_ignored():
    # 100 -> 101 -> 102: cumulative rise = 2 m, below MIN_GAIN_THRESHOLD_M (3).
    # Each step is 1 m; pending accumulates to 2 m but never reaches 3 m.
    assert _elevation_gain(_pts(100.0, 101.0, 102.0)) == 0.0


def test_elevation_gain_skips_nulls():
    # Only non-null alts are used: 100, 150, 200 → gain 100.
    assert _elevation_gain(_pts(100.0, None, 150.0, None, 200.0)) == 100.0


def test_elevation_gain_all_null_is_none():
    assert _elevation_gain(_pts(None, None)) is None


def test_elevation_gain_empty_is_none():
    assert _elevation_gain([]) is None


def test_elevation_gain_single_point_is_none():
    # Need at least 2 altitude-bearing points.
    assert _elevation_gain(_pts(100.0)) is None


def test_elevation_gain_flat_is_zero():
    # No altitude change → gain 0.
    assert _elevation_gain(_pts(100.0, 100.0, 100.0)) == 0.0


def test_elevation_gain_rounds_to_2dp():
    # Steps of 1.5 m each: two steps = 3.0 m rise meets threshold exactly.
    # 10 -> 11.5 -> 13 -> 14.5 -> 16: four rises of 1.5 each = 6 m total.
    # pending accumulates: 1.5, 3.0 → flush 3.0 (gain=3.0), pending=0
    #                       1.5, 3.0 → flush 3.0 (gain=6.0), pending=0
    assert _elevation_gain(_pts(10.0, 11.5, 13.0, 14.5, 16.0)) == 6.0


def test_elevation_gain_threshold_constant():
    assert MIN_GAIN_THRESHOLD_M == 3.0
