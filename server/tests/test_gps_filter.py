from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.schemas.run import Point
from app.services.gps_filter import filter_trace, haversine_m, trace_distance_m


T0 = datetime(2026, 5, 19, 12, 0, 0, tzinfo=timezone.utc)


def _p(lat: float, lng: float, sec_offset: float, accuracy: float | None = 10.0) -> Point:
    return Point(lat=lat, lng=lng, timestamp=T0 + timedelta(seconds=sec_offset), accuracy=accuracy)


def test_drops_points_over_accuracy_threshold():
    pts = [
        _p(47.6, -122.3, 0, accuracy=10),
        _p(47.6001, -122.3, 1, accuracy=80),  # > 50m, drop
        _p(47.6002, -122.3, 2, accuracy=5),
    ]
    kept = filter_trace(pts)
    accuracies = [p.accuracy for p in kept]
    assert 80 not in accuracies
    assert len(kept) == 2


def test_drops_segment_implying_impossible_speed():
    # Two points 1 km apart in 1 s ≈ 1000 m/s — must drop the second
    pts = [
        _p(47.6, -122.3, 0),
        _p(47.609, -122.3, 1),  # ~1 km north
        _p(47.6001, -122.3, 60),
    ]
    kept = filter_trace(pts)
    # second point dropped; first + third remain
    assert len(kept) == 2
    assert kept[0].lat == 47.6
    assert kept[1].lat == 47.6001


def test_realistic_running_trace_kept():
    # ~3 m/s pace (jog) — all should pass
    pts = [_p(47.6 + i * 0.00003, -122.3, i) for i in range(20)]
    kept = filter_trace(pts)
    assert len(kept) == 20


def test_handles_missing_timestamps_gracefully():
    pts = [
        Point(lat=47.6, lng=-122.3, timestamp=None, accuracy=10),
        Point(lat=47.601, lng=-122.3, timestamp=None, accuracy=10),
    ]
    kept = filter_trace(pts)
    assert len(kept) == 2


def test_haversine_known_distance():
    # 1° latitude ≈ 111.195 km
    d = haversine_m(0.0, 0.0, 1.0, 0.0)
    assert 110_000 < d < 112_000


def test_trace_distance_sums_segments():
    pts = [
        Point(lat=0.0, lng=0.0),
        Point(lat=0.001, lng=0.0),
        Point(lat=0.002, lng=0.0),
    ]
    d = trace_distance_m(pts)
    # ~111m + ~111m ≈ 222m
    assert 220 < d < 224
