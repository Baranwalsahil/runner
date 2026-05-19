from __future__ import annotations

from uuid import UUID

import asyncpg
from fastapi import HTTPException, status

from app.cache import leaderboard_cache, territory_cache
from app.constants import H3_RESOLUTION, MAX_CELLS_PER_RUN
from app.schemas.run import RunCreate, RunResult, RunSummary
from app.services.gps_filter import filter_trace, trace_distance_m
from app.services.h3_service import trace_to_cells

CLAIM_SQL = """
INSERT INTO claimed_cells (h3_index, user_id, resolution, claim_count)
VALUES ($1, $2, $3, 1)
ON CONFLICT (h3_index) DO UPDATE
  SET user_id = EXCLUDED.user_id,
      claimed_at = NOW(),
      claim_count = claimed_cells.claim_count + 1
WHERE claimed_cells.user_id IS DISTINCT FROM EXCLUDED.user_id;
"""


def _bad_request(msg: str) -> HTTPException:
    return HTTPException(status.HTTP_400_BAD_REQUEST, msg)


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

    # Build LINESTRING WKT (lng lat order per WKT spec)
    wkt = "LINESTRING(" + ", ".join(f"{p.lng} {p.lat}" for p in cleaned) + ")"

    cell_list = list(cells)

    async with pool.acquire() as conn:
        async with conn.transaction():
            # Capture displaced owners before the upsert; their totals must
            # also be recomputed once ownership transfers.
            displaced_rows = await conn.fetch(
                """
                SELECT DISTINCT user_id FROM claimed_cells
                WHERE h3_index = ANY($1::text[])
                  AND user_id IS NOT NULL
                  AND user_id <> $2
                """,
                cell_list,
                user_id,
            )
            displaced: list[UUID] = [r["user_id"] for r in displaced_rows]

            run_row = await conn.fetchrow(
                """
                INSERT INTO runs (user_id, started_at, ended_at, distance_meters,
                                  gps_trace, cells_claimed)
                VALUES ($1, $2, $3, $4, ST_GeomFromText($5, 4326), $6)
                RETURNING id
                """,
                user_id,
                payload.started_at.replace(tzinfo=None) if payload.started_at.tzinfo else payload.started_at,
                payload.ended_at.replace(tzinfo=None) if payload.ended_at.tzinfo else payload.ended_at,
                distance_m,
                wkt,
                len(cells),
            )
            run_id: UUID = run_row["id"]

            await conn.executemany(
                CLAIM_SQL,
                [(idx, user_id, H3_RESOLUTION) for idx in cell_list],
            )

            affected_ids: list[UUID] = [user_id, *displaced]
            updated = await conn.fetch(
                """
                UPDATE users u
                SET total_cells = (
                      SELECT COUNT(*) FROM claimed_cells WHERE user_id = u.id
                    ),
                    updated_at = NOW()
                WHERE u.id = ANY($1::uuid[])
                RETURNING u.id, u.total_cells
                """,
                affected_ids,
            )

    new_total = 0
    totals_by_id: dict[UUID, int] = {}
    for row in updated:
        totals_by_id[row["id"]] = row["total_cells"]
        if row["id"] == user_id:
            new_total = row["total_cells"]

    if cache is not None:
        for uid, total in totals_by_id.items():
            await leaderboard_cache.upsert_user_total(cache, uid, total)
        await territory_cache.flush_all(cache)

    return RunResult(
        run_id=run_id,
        cells_claimed=len(cells),
        new_total=new_total,
    )


async def list_runs(pool: asyncpg.Pool, user_id: UUID) -> list[RunSummary]:
    rows = await pool.fetch(
        """
        SELECT id, started_at, ended_at, distance_meters, cells_claimed, created_at
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
            cells_claimed=r["cells_claimed"],
            created_at=r["created_at"],
        )
        for r in rows
    ]


async def get_run(pool: asyncpg.Pool, user_id: UUID, run_id: UUID) -> RunSummary | None:
    row = await pool.fetchrow(
        """
        SELECT id, started_at, ended_at, distance_meters, cells_claimed, created_at
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
        cells_claimed=row["cells_claimed"],
        created_at=row["created_at"],
    )
