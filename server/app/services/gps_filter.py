from __future__ import annotations

import math
from datetime import datetime, timezone

from app.constants import GPS_ACCURACY_THRESHOLD_M, MAX_SPEED_MPS
from app.schemas.run import Point

EARTH_RADIUS_M = 6_371_000.0


def haversine_m(a_lat: float, a_lng: float, b_lat: float, b_lng: float) -> float:
    lat1, lat2 = math.radians(a_lat), math.radians(b_lat)
    dlat = lat2 - lat1
    dlng = math.radians(b_lng - a_lng)
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(h))


def _ts_seconds(t: datetime | None) -> float | None:
    if t is None:
        return None
    if t.tzinfo is None:
        t = t.replace(tzinfo=timezone.utc)
    return t.timestamp()


def filter_trace(points: list[Point]) -> list[Point]:
    """Drop points with poor GPS accuracy and segments implying impossible speed.

    - Accuracy filter: any point with `accuracy_m > GPS_ACCURACY_THRESHOLD_M` removed.
    - Speed filter: walks the trace in order; whenever the segment from the
      last-kept point to the candidate implies speed > MAX_SPEED_MPS, the
      candidate is dropped (it stays anchored to the previous good point).
    - Points without timestamps participate in accuracy filtering only;
      speed checks against them are skipped.
    """
    accuracy_ok = [
        p
        for p in points
        if p.accuracy is None or p.accuracy <= GPS_ACCURACY_THRESHOLD_M
    ]
    if len(accuracy_ok) <= 1:
        return list(accuracy_ok)

    kept: list[Point] = [accuracy_ok[0]]
    for cand in accuracy_ok[1:]:
        prev = kept[-1]
        prev_t = _ts_seconds(prev.timestamp)
        cand_t = _ts_seconds(cand.timestamp)
        if prev_t is None or cand_t is None or cand_t <= prev_t:
            kept.append(cand)
            continue
        dist = haversine_m(prev.lat, prev.lng, cand.lat, cand.lng)
        speed = dist / (cand_t - prev_t)
        if speed > MAX_SPEED_MPS:
            continue
        kept.append(cand)
    return kept


def trace_distance_m(points: list[Point]) -> float:
    if len(points) < 2:
        return 0.0
    total = 0.0
    for a, b in zip(points, points[1:]):
        total += haversine_m(a.lat, a.lng, b.lat, b.lng)
    return total
