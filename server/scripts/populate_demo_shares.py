"""Seed contested-cell demo data against a running API (default :8000).

User A runs a path 3x (builds x3 strength); User B runs it once (chips A to
x2, B holds x1). Prints the resulting territory shares.

Run:  python scripts/populate_demo_shares.py
"""

from __future__ import annotations

import json
import os
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone

TAG = uuid.uuid4().hex[:6]

API = os.getenv("API_URL", "http://localhost:8000")

# A ~400m N-S path; ~22m steps every 3s (~7 m/s, passes filter).
LAT0 = float(os.getenv("LAT0", "47.6062"))
LNG0 = float(os.getenv("LNG0", "-122.3321"))
N = 20


def _post(path: str, body: dict, token: str | None = None) -> dict:
    data = json.dumps(body).encode()
    req = urllib.request.Request(API + path, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def _get(path: str, token: str | None = None) -> list | dict:
    req = urllib.request.Request(API + path)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def _trace() -> list[dict]:
    base = datetime(2026, 6, 6, 12, 0, 0, tzinfo=timezone.utc)
    return [
        {
            "lat": LAT0 + i * 0.0002,
            "lng": LNG0,
            "timestamp": (base + timedelta(seconds=i * 3)).isoformat(),
            "accuracy": 8,
        }
        for i in range(N)
    ]


def _signup(suffix: str) -> str:
    body = {
        "email": f"demo-{suffix}@example.com",
        "username": f"demo_{suffix}",
        "password": "secretsecret",
    }
    try:
        return _post("/auth/signup", body)["token"]
    except urllib.error.HTTPError:
        # Already exists — log in.
        return _post("/auth/login", {"email": body["email"], "password": body["password"]})["token"]


def _run(token: str) -> dict:
    trace = _trace()
    return _post(
        "/runs",
        {"gps_trace": trace, "started_at": trace[0]["timestamp"], "ended_at": trace[-1]["timestamp"]},
        token,
    )


def main() -> None:
    tok_a = _signup(f"alpha_{TAG}")
    tok_b = _signup(f"bravo_{TAG}")

    for i in range(3):
        r = _run(tok_a)
        print(f"A run {i + 1}: cells={r['cells_claimed']} total_strength={r['new_total']}")

    r = _run(tok_b)
    print(f"B run 1: cells={r['cells_claimed']} total_strength={r['new_total']}")

    bounds = "47.600,-122.340,47.615,-122.325"
    cells = _get(f"/territory?bounds={bounds}", tok_a)
    contested = [c for c in cells if len(c.get("shares", [])) > 1]
    print(f"\nTerritory: {len(cells)} cells, {len(contested)} contested")
    for c in contested[:5]:
        parts = ", ".join(f"@{s['username']} x{s['count']}" for s in c["shares"])
        print(f"  {c['h3_index']}: owner=@{c['username']} | {parts}")


if __name__ == "__main__":
    main()
