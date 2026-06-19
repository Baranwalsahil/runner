"""Unit tests for average-elevation computation (pure, no DB)."""

from __future__ import annotations

from types import SimpleNamespace

from app.services.run_service import _avg_elevation


def _pts(*alts):
    return [SimpleNamespace(alt=a) for a in alts]


def test_avg_elevation_mean_of_samples():
    assert _avg_elevation(_pts(100.0, 200.0, 300.0)) == 200.0


def test_avg_elevation_skips_nulls():
    # Mean over the two non-null samples only.
    assert _avg_elevation(_pts(100.0, None, 140.0)) == 120.0


def test_avg_elevation_all_null_is_none():
    assert _avg_elevation(_pts(None, None)) is None


def test_avg_elevation_empty_is_none():
    assert _avg_elevation([]) is None


def test_avg_elevation_rounds_to_2dp():
    assert _avg_elevation(_pts(10.0, 10.0, 11.0)) == 10.33
