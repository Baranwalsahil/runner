"""Seed a handful of coherent demo runs for local manual testing.

Posts several runs for demo_alpha over the last few days, each tracing a
distinct walkable path in one city (Seattle) so every run claims a cluster
of adjacent H3 cells. Lets you verify dashboard run-history selection:
pick a run -> its cells render and the map recenters on them.

Run against a live backend:
    python -m scripts.seed_demo_runs            # defaults to http://localhost:8000
    API_URL=http://localhost:8000 python -m scripts.seed_demo_runs
"""

from __future__ import annotations

import json
import os
import urllib.request
from datetime import datetime, timedelta, timezone

API_URL = os.environ.get("API_URL", "http://localhost:8000").rstrip("/")
EMAIL = os.environ.get("SEED_EMAIL", "demo_a@test.com")
PASSWORD = os.environ.get("SEED_PASSWORD", "secretsecret")

# Anchor each run in central Seattle; spread starts a little so the runs
# cover different (but nearby) blocks.
BASE_LAT = 47.6097
BASE_LNG = -122.3331

# (day_offset_back, label, start_dlat, start_dlng, bearing, n_points)
# bearing: (dlat_step, dlng_step) per point, ~150-180 m apart.
RUNS = [
    (1, "Downtown loop", 0.000, 0.000, (0.0016, 0.0000), 10),
    (2, "Waterfront dash", 0.006, -0.004, (0.0000, 0.0018), 8),
    (3, "Capitol Hill climb", -0.005, 0.006, (0.0014, 0.0012), 9),
    (4, "South sprint", -0.010, 0.000, (-0.0015, 0.0010), 7),
    (5, "North trail", 0.012, 0.003, (0.0016, -0.0008), 11),
]


def _post(path: str, payload: dict, token: str | None = None) -> dict:
    data = json.dumps(payload).encode()
    headers = {"content-type": "application/json"}
    if token:
        headers["authorization"] = f"Bearer {token}"
    req = urllib.request.Request(API_URL + path, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode())


def _build_trace(slat: float, slng: float, step: tuple[float, float], n: int, start: datetime) -> list[dict]:
    dlat, dlng = step
    pts = []
    for i in range(n):
        ts = start + timedelta(seconds=30 * i)  # ~150 m / 30 s ≈ 5 m/s
        pts.append(
            {
                "lat": round(slat + dlat * i, 6),
                "lng": round(slng + dlng * i, 6),
                "timestamp": ts.isoformat(),
                "accuracy": 5,
            }
        )
    return pts


def main() -> None:
    login = _post("/auth/login", {"email": EMAIL, "password": PASSWORD})
    token = login["token"]
    print(f"logged in as {login['user']['username']} ({EMAIL})")

    now = datetime.now(timezone.utc)
    for days_back, label, dlat0, dlng0, step, n in RUNS:
        started = (now - timedelta(days=days_back)).replace(hour=7, minute=0, second=0, microsecond=0)
        trace = _build_trace(BASE_LAT + dlat0, BASE_LNG + dlng0, step, n, started)
        ended = datetime.fromisoformat(trace[-1]["timestamp"]) + timedelta(seconds=30)
        payload = {
            "gps_trace": [{k: p[k] for k in ("lat", "lng", "timestamp", "accuracy")} for p in trace],
            "started_at": started.isoformat(),
            "ended_at": ended.isoformat(),
        }
        res = _post("/runs", payload, token)
        print(f"  {label:22s} {days_back}d ago -> run {res['run_id'][:8]} cells_claimed={res['cells_claimed']}")

    print("done. Open the dashboard, pick a run from Recent Battles, confirm its cells render.")


if __name__ == "__main__":
    main()
