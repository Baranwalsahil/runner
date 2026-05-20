"""Seed demo users + runs against a running stack.

Usage from host (stack via docker compose up):

    python server/scripts/seed_demo.py
    python server/scripts/seed_demo.py --base http://localhost:8000 --users 6

Each user signs up (or logs in if email already exists), then submits one
synthetic Seattle-area trace through `/runs`. Speeds stay below
`MAX_SPEED_MPS=12` so the GPS filter accepts them.
"""

from __future__ import annotations

import argparse
import json
import random
import time
import urllib.error
import urllib.request
from typing import Any

DEMO_USERS = [
    ("demo_alpha", "demo_a@test.com", 47.612, -122.339, 12),
    ("demo_bravo", "demo_b@test.com", 47.608, -122.341, 8),
    ("demo_charlie", "demo_c@test.com", 47.620, -122.350, 18),
    ("demo_delta", "demo_d@test.com", 47.604, -122.327, 6),
    ("demo_echo", "demo_e@test.com", 47.616, -122.331, 10),
    ("demo_foxtrot", "demo_f@test.com", 47.601, -122.335, 14),
]


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
        lat = start_lat + i * 0.0003
        lng = start_lng + i * 0.0001
        ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(base_ts + i * 5))
        pts.append({"lat": lat, "lng": lng, "timestamp": ts, "accuracy": 10})
    return pts


def login_or_signup(base: str, username: str, email: str) -> str | None:
    creds = {"email": email, "password": "secretsecret"}
    out = post(base, "/auth/signup", {**creds, "username": username})
    if "token" in out:
        return out["token"]
    out = post(base, "/auth/login", creds)
    return out.get("token")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:8000")
    ap.add_argument(
        "--users", type=int, default=len(DEMO_USERS),
        help="how many demo users to seed (max %d)" % len(DEMO_USERS),
    )
    args = ap.parse_args()
    random.seed(42)

    selected = DEMO_USERS[: args.users]
    last_token = None
    for username, email, lat, lng, steps in selected:
        token = login_or_signup(args.base, username, email)
        if token is None:
            print(f"{username:13} → AUTH FAILED")
            continue
        last_token = token
        pts = trace(lat, lng, steps)
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
