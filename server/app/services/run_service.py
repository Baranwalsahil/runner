from __future__ import annotations

import json
from datetime import datetime, timezone
from uuid import UUID

import asyncpg
from fastapi import HTTPException, status

from app.cache import leaderboard_cache, territory_cache
from app.constants import H3_RESOLUTION, MAX_CELLS_PER_RUN
from app.schemas.run import (
    RunCreate,
    RunDetail,
    RunFeedItem,
    RunResult,
    RunSummary,
    TracePoint,
)
from app.services.gps_filter import filter_trace, trace_distance_m
from app.services.h3_service import trace_to_cells


def _time_ago(dt: datetime) -> str:
    """Return a human-readable relative time string for a UTC datetime."""
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff_s = max(0, int((now - dt).total_seconds()))
    if diff_s < 60:
        return "just now"
    m = diff_s // 60
    if m < 60:
        return f"{m}m ago"
    h = m // 60
    if h < 24:
        return f"{h}h ago"
    return f"{h // 24}d ago"

# Step 1: running a cell grants the runner +1 strength on it.
GRANT_SQL = """
INSERT INTO claimed_cell_users (h3_index, user_id, count, updated_at)
SELECT unnest($1::text[]), $2, 1, NOW()
ON CONFLICT (h3_index, user_id) DO UPDATE
  SET count = claimed_cell_users.count + 1,
      updated_at = NOW();
"""

# Step 2: every other holder on those cells loses 1 strength (the "chip").
CHIP_SQL = """
UPDATE claimed_cell_users
SET count = count - 1, updated_at = NOW()
WHERE h3_index = ANY($1::text[]) AND user_id <> $2;
"""

# Step 3: drop holders whose strength fell to zero.
PRUNE_SQL = """
DELETE FROM claimed_cell_users
WHERE h3_index = ANY($1::text[]) AND count <= 0;
"""

# Step 4: recompute the owner-pointer for each touched cell. Owner = holder
# with max count (tiebreak: most recently updated). Every touched cell has at
# least one holder (the runner), so the inner select is never empty.
OWNER_SQL = """
INSERT INTO claimed_cells (h3_index, user_id, resolution, claim_count, claimed_at)
SELECT r.h3_index, r.user_id, $2, r.count, NOW()
FROM (
  SELECT DISTINCT ON (h3_index) h3_index, user_id, count
  FROM claimed_cell_users
  WHERE h3_index = ANY($1::text[])
  ORDER BY h3_index, count DESC, updated_at DESC
) r
ON CONFLICT (h3_index) DO UPDATE
  SET user_id = EXCLUDED.user_id,
      claim_count = EXCLUDED.claim_count,
      claimed_at = NOW();
"""


def _bad_request(msg: str) -> HTTPException:
    return HTTPException(status.HTTP_400_BAD_REQUEST, msg)


def _avg_elevation(points) -> float | None:
    """Mean device altitude (metres) over points that report one. None if no
    point carries an altitude (desktop / no-fix devices)."""
    alts = [p.alt for p in points if p.alt is not None]
    if not alts:
        return None
    return round(sum(alts) / len(alts), 2)


async def ingest_run(
    pool: asyncpg.Pool,
    user_id: UUID,
    payload: RunCreate,
    cache=None,
) -> RunResult:
    cleaned = filter_trace(payload.gps_trace)
    if len(cleaned) < 2:
        raise _bad_request("trace too noisy after filtering")

    cells = trace_to_cells(((p.lat, p.lng) for p in cleaned), H3_RESOLUTION)
    if len(cells) == 0:
        raise _bad_request("trace produced zero cells")
    if len(cells) > MAX_CELLS_PER_RUN:
        raise _bad_request(f"trace exceeds {MAX_CELLS_PER_RUN} cells")

    distance_m = trace_distance_m(cleaned)
    avg_elevation_m = _avg_elevation(cleaned)

    # Build LINESTRING WKT (lng lat order per WKT spec)
    wkt = "LINESTRING(" + ", ".join(f"{p.lng} {p.lat}" for p in cleaned) + ")"

    cell_list = list(cells)

    async with pool.acquire() as conn:
        async with conn.transaction():
            # Capture every prior holder of these cells before mutating. Their
            # totals must be recomputed too — chipping reduces their strength
            # (and may evict them), so they are "affected" alongside the runner.
            holder_rows = await conn.fetch(
                """
                SELECT DISTINCT user_id FROM claimed_cell_users
                WHERE h3_index = ANY($1::text[]) AND user_id <> $2
                """,
                cell_list,
                user_id,
            )
            displaced: list[UUID] = [r["user_id"] for r in holder_rows]

            run_row = await conn.fetchrow(
                """
                INSERT INTO runs (user_id, started_at, ended_at, distance_meters,
                                  avg_elevation_m, gps_trace, cells_claimed)
                VALUES ($1, $2, $3, $4, $5, ST_GeomFromText($6, 4326), $7)
                RETURNING id
                """,
                user_id,
                payload.started_at.replace(tzinfo=None) if payload.started_at.tzinfo else payload.started_at,
                payload.ended_at.replace(tzinfo=None) if payload.ended_at.tzinfo else payload.ended_at,
                distance_m,
                avg_elevation_m,
                wkt,
                len(cells),
            )
            run_id: UUID = run_row["id"]

            # Grant runner strength, chip rivals, prune depleted, reseat owner.
            await conn.execute(GRANT_SQL, cell_list, user_id)
            await conn.execute(CHIP_SQL, cell_list, user_id)
            await conn.execute(PRUNE_SQL, cell_list)
            await conn.execute(OWNER_SQL, cell_list, H3_RESOLUTION)

            # total_cells = cells owned; total_strength = SUM(count) of shares.
            affected_ids: list[UUID] = [user_id, *displaced]
            updated = await conn.fetch(
                """
                UPDATE users u
                SET total_cells = COALESCE((
                      SELECT COUNT(*) FROM claimed_cells WHERE user_id = u.id
                    ), 0),
                    total_strength = COALESCE((
                      SELECT SUM(count) FROM claimed_cell_users WHERE user_id = u.id
                    ), 0),
                    updated_at = NOW()
                WHERE u.id = ANY($1::uuid[])
                RETURNING u.id, u.total_cells, u.total_strength
                """,
                affected_ids,
            )

    # Leaderboard ranks by strength; new_total reports the runner's strength.
    new_total = 0
    strength_by_id: dict[UUID, int] = {}
    for row in updated:
        strength_by_id[row["id"]] = row["total_strength"]
        if row["id"] == user_id:
            new_total = row["total_strength"]

    if cache is not None:
        for uid, strength in strength_by_id.items():
            await leaderboard_cache.upsert_user_total(cache, uid, strength)
        await territory_cache.flush_all(cache)

    return RunResult(
        run_id=run_id,
        cells_claimed=len(cells),
        new_total=new_total,
    )


async def list_runs(pool: asyncpg.Pool, user_id: UUID) -> list[RunSummary]:
    rows = await pool.fetch(
        """
        SELECT id, started_at, ended_at, distance_meters, avg_elevation_m,
               cells_claimed, created_at
        FROM runs WHERE user_id = $1 ORDER BY started_at DESC LIMIT 100
        """,
        user_id,
    )
    return [
        RunSummary(
            id=r["id"],
            started_at=r["started_at"],
            ended_at=r["ended_at"],
            distance_meters=float(r["distance_meters"]) if r["distance_meters"] is not None else None,
            avg_elevation_m=float(r["avg_elevation_m"]) if r["avg_elevation_m"] is not None else None,
            cells_claimed=r["cells_claimed"],
            created_at=r["created_at"],
        )
        for r in rows
    ]


async def get_run(pool: asyncpg.Pool, user_id: UUID, run_id: UUID) -> RunSummary | None:
    row = await pool.fetchrow(
        """
        SELECT id, started_at, ended_at, distance_meters, avg_elevation_m,
               cells_claimed, created_at
        FROM runs WHERE id = $1 AND user_id = $2
        """,
        run_id,
        user_id,
    )
    if row is None:
        return None
    return RunSummary(
        id=row["id"],
        started_at=row["started_at"],
        ended_at=row["ended_at"],
        distance_meters=float(row["distance_meters"]) if row["distance_meters"] is not None else None,
        avg_elevation_m=float(row["avg_elevation_m"]) if row["avg_elevation_m"] is not None else None,
        cells_claimed=row["cells_claimed"],
        created_at=row["created_at"],
    )


async def get_run_detail(
    pool: asyncpg.Pool, user_id: UUID, run_id: UUID
) -> RunDetail | None:
    """Return a single run with its GPS trace and the H3 cells it claimed.

    Cells are recomputed from the stored trace (claimed_cells is not linked to
    runs), so the result reflects the cells this run originally covered
    regardless of subsequent ownership changes.
    """
    row = await pool.fetchrow(
        """
        SELECT id, started_at, ended_at, distance_meters, avg_elevation_m,
               cells_claimed, created_at,
               ST_AsGeoJSON(gps_trace) AS trace_geojson
        FROM runs WHERE id = $1 AND user_id = $2
        """,
        run_id,
        user_id,
    )
    if row is None:
        return None

    coords: list[list[float]] = []
    if row["trace_geojson"]:
        geo = json.loads(row["trace_geojson"])
        coords = geo.get("coordinates") or []  # [[lng, lat], ...]

    trace = [TracePoint(lat=lat, lng=lng) for lng, lat in coords]
    cells = sorted(
        trace_to_cells(((p.lat, p.lng) for p in trace), H3_RESOLUTION)
    )
    return RunDetail(
        id=row["id"],
        started_at=row["started_at"],
        ended_at=row["ended_at"],
        distance_meters=float(row["distance_meters"]) if row["distance_meters"] is not None else None,
        avg_elevation_m=float(row["avg_elevation_m"]) if row["avg_elevation_m"] is not None else None,
        cells_claimed=row["cells_claimed"],
        created_at=row["created_at"],
        trace=trace,
        cells=cells,
    )


async def feed_runs(
    pool: asyncpg.Pool, user_id: UUID, limit: int = 12
) -> list[RunFeedItem]:
    """Return the current user's most recent run activity as feed items."""
    rows = await pool.fetch(
        """
        SELECT r.id, r.cells_claimed, r.started_at, u.username
        FROM runs r
        JOIN users u ON u.id = r.user_id
        WHERE r.user_id = $1
        ORDER BY r.started_at DESC
        LIMIT $2
        """,
        user_id,
        limit,
    )
    items: list[RunFeedItem] = []
    for i, row in enumerate(rows):
        cells = row["cells_claimed"] or 0
        username = row["username"] or "unknown"
        items.append(
            RunFeedItem(
                id=f"run-{row['id']}",
                type="gained",
                label="Territory Gained",
                time=_time_ago(row["started_at"]),
                title=f"{cells} cell{'s' if cells != 1 else ''} claimed",
                subject_label="by",
                user=f"@{username}",
                accent=i == 0,
                challengeable=False,
            )
        )
    return items
