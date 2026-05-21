from __future__ import annotations

from uuid import UUID

import asyncpg

from app.schemas.auth import User


class UserAlreadyExists(Exception):
    pass


_SELECT_COLUMNS = (
    "id, email, username, first_name, last_name, "
    "avatar_url, total_cells, total_area_m2, created_at"
)


def _row_to_user(row: asyncpg.Record) -> User:
    return User(
        id=row["id"],
        email=row["email"],
        username=row["username"],
        first_name=row["first_name"],
        last_name=row["last_name"],
        avatar_url=row["avatar_url"],
        total_cells=row["total_cells"],
        total_area_m2=float(row["total_area_m2"]),
        created_at=row["created_at"],
    )


async def create_user(
    pool: asyncpg.Pool,
    email: str,
    username: str,
    password_hash: str,
) -> User:
    query = (
        f"INSERT INTO users (email, username, password_hash) "
        f"VALUES ($1, $2, $3) RETURNING {_SELECT_COLUMNS}"
    )
    try:
        row = await pool.fetchrow(query, email, username, password_hash)
    except asyncpg.UniqueViolationError as e:
        raise UserAlreadyExists(str(e)) from e
    return _row_to_user(row)


async def get_user_by_email(pool: asyncpg.Pool, email: str) -> tuple[User, str] | None:
    """Returns (user, password_hash) tuple or None."""
    row = await pool.fetchrow(
        f"SELECT {_SELECT_COLUMNS}, password_hash FROM users WHERE email = $1",
        email,
    )
    if row is None:
        return None
    return _row_to_user(row), row["password_hash"]


async def get_user_by_id(pool: asyncpg.Pool, user_id: UUID) -> User | None:
    row = await pool.fetchrow(
        f"SELECT {_SELECT_COLUMNS} FROM users WHERE id = $1",
        user_id,
    )
    if row is None:
        return None
    return _row_to_user(row)


async def update_user(
    pool: asyncpg.Pool,
    user_id: UUID,
    *,
    username: str | None = None,
    first_name: str | None = None,
    last_name: str | None = None,
) -> User | None:
    fields: list[str] = []
    values: list = []
    if username is not None:
        fields.append(f"username = ${len(values) + 1}")
        values.append(username)
    if first_name is not None:
        fields.append(f"first_name = ${len(values) + 1}")
        values.append(first_name)
    if last_name is not None:
        fields.append(f"last_name = ${len(values) + 1}")
        values.append(last_name)
    if not fields:
        return await get_user_by_id(pool, user_id)
    fields.append("updated_at = NOW()")
    values.append(user_id)
    query = (
        f"UPDATE users SET {', '.join(fields)} "
        f"WHERE id = ${len(values)} RETURNING {_SELECT_COLUMNS}"
    )
    try:
        row = await pool.fetchrow(query, *values)
    except asyncpg.UniqueViolationError as e:
        raise UserAlreadyExists(str(e)) from e
    if row is None:
        return None
    return _row_to_user(row)
