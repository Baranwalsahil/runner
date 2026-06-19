"""Seed demo users + runs against a running stack.

Usage from host (stack via docker compose up):

    python server/scripts/seed_demo.py
    python server/scripts/seed_demo.py --users 4
    python server/scripts/seed_demo.py --center 21.9974,79.0011
    python server/scripts/seed_demo.py --base http://localhost:8000 --users 6 --center 21.9974,79.0011

Each user signs up (or logs in if email already exists), then submits one
synthetic trace around `--center` through `/runs`. Speeds stay below
`MAX_SPEED_MPS=12` so the GPS filter accepts them.
"""

from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.request
from typing import Any

# (username, email, lat_offset_deg, lng_offset_deg, steps).
# Offsets are added to --center so the cohort clusters around it.
DEMO_USERS = [
    ("demo_alpha",   "demo_a@test.com",  0.0058, -0.0069, 12),
    ("demo_bravo",   "demo_b@test.com",  0.0018, -0.0089,  8),
    ("demo_charlie", "demo_c@test.com",  0.0138, -0.0179, 18),
    ("demo_delta",   "demo_d@test.com", -0.0022,  0.0051,  6),
    ("demo_echo",    "demo_e@test.com",  0.0098,  0.0011, 10),
    ("demo_foxtrot", "demo_f@test.com", -0.0052, -0.0029, 14),
]

DEFAULT_CENTER = (47.6062, -122.3321)  # Seattle


def post(base: str, path: str, body: dict, token: str | None = None) -> dict[str, Any]:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        base + path, data=json.dumps(body).encode(), headers=headers
    )
    try:
        return json.loads(urllib.request.urlopen(req).read())
    except urllib.error.HTTPError as e:
        return {"_error": e.code, "_body": e.read().decode()[:200]}


def get(base: str, path: str, token: str) -> dict[str, Any]:
    req = urllib.request.Request(
        base + path, headers={"Authorization": f"Bearer {token}"}
    )
    try:
        return json.loads(urllib.request.urlopen(req).read())
    except urllib.error.HTTPError as e:
        return {"_error": e.code, "_body": e.read().decode()[:200]}


def trace(start_lat: float, start_lng: float, steps: int) -> list[dict]:
    base_ts = int(
        time.mktime(time.strptime("2026-05-20 12:00:00", "%Y-%m-%d %H:%M:%S"))
    )
    pts = []
    for i in range(steps):
        lat = start_lat + i * 0.0003   # ~33 m/step latitude
        lng = start_lng + i * 0.0001   # small lng drift
        alt = 50.0 + i * 2.0           # gentle climb so avg elevation is non-null
        ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(base_ts + i * 5))
        pts.append(
            {"lat": lat, "lng": lng, "alt": alt, "timestamp": ts, "accuracy": 10}
        )
    return pts


def login_or_signup(base: str, username: str, email: str) -> str | None:
    creds = {"email": email, "password": "secretsecret"}
    out = post(base, "/auth/signup", {**creds, "username": username})
    if "token" in out:
        return out["token"]
    out = post(base, "/auth/login", creds)
    return out.get("token")


def parse_center(raw: str) -> tuple[float, float]:
    parts = raw.split(",")
    if len(parts) != 2:
        raise argparse.ArgumentTypeError(
            "--center must be 'lat,lng' (e.g. 21.9974,79.0011)"
        )
    return float(parts[0]), float(parts[1])


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:8000")
    ap.add_argument(
        "--users", type=int, default=len(DEMO_USERS),
        help="how many demo users to seed (max %d)" % len(DEMO_USERS),
    )
    ap.add_argument(
        "--center", type=parse_center,
        default=DEFAULT_CENTER,
        help="lat,lng to anchor the cohort (default: Seattle %.4f,%.4f)" % DEFAULT_CENTER,
    )
    args = ap.parse_args()
    c_lat, c_lng = args.center
    print(f"seeding around lat={c_lat} lng={c_lng}\n")

    selected = DEMO_USERS[: args.users]
    last_token = None
    for username, email, dlat, dlng, steps in selected:
        token = login_or_signup(args.base, username, email)
        if token is None:
            print(f"{username:13} → AUTH FAILED")
            continue
        last_token = token
        pts = trace(c_lat + dlat, c_lng + dlng, steps)
        body = {
            "gps_trace": pts,
            "started_at": pts[0]["timestamp"],
            "ended_at": pts[-1]["timestamp"],
        }
        out = post(args.base, "/runs", body, token=token)
        print(f"{username:13} → {out}")

    if last_token is None:
        return
    print("\n--- /leaderboard ---")
    print(json.dumps(get(args.base, "/leaderboard", last_token), indent=2))
    print("\n--- /territory/stats ---")
    print(json.dumps(get(args.base, "/territory/stats", last_token), indent=2))


if __name__ == "__main__":
    main()
