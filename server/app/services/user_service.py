from __future__ import annotations

from uuid import UUID

import asyncpg

from app.schemas.auth import User


class UserAlreadyExists(Exception):
    pass


_SELECT_COLUMNS = (
    "id, email, username, first_name, last_name, "
    "avatar_url, color, total_cells, total_strength, total_area_m2, "
    "weight_kg, goal_weight_kg, height_cm, age, sex, created_at"
)


def _row_to_user(row: asyncpg.Record) -> User:
    return User(
        id=row["id"],
        email=row["email"],
        username=row["username"],
        first_name=row["first_name"],
        last_name=row["last_name"],
        avatar_url=row["avatar_url"],
        color=row["color"],
        total_cells=row["total_cells"],
        total_strength=row["total_strength"],
        total_area_m2=float(row["total_area_m2"]),
        weight_kg=float(row["weight_kg"]) if row["weight_kg"] is not None else None,
        goal_weight_kg=(
            float(row["goal_weight_kg"]) if row["goal_weight_kg"] is not None else None
        ),
        height_cm=float(row["height_cm"]) if row["height_cm"] is not None else None,
        age=row["age"],
        sex=row["sex"],
        created_at=row["created_at"],
    )


async def create_user(
    pool: asyncpg.Pool,
    email: str,
    username: str,
    password_hash: str,
    color: str | None = None,
) -> User:
    query = (
        f"INSERT INTO users (email, username, password_hash, color) "
        f"VALUES ($1, $2, $3, $4) RETURNING {_SELECT_COLUMNS}"
    )
    try:
        row = await pool.fetchrow(query, email, username, password_hash, color)
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
    weight_kg: float | None = None,
    goal_weight_kg: float | None = None,
    height_cm: float | None = None,
    age: int | None = None,
    sex: str | None = None,
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
    if weight_kg is not None:
        fields.append(f"weight_kg = ${len(values) + 1}")
        values.append(weight_kg)
    if goal_weight_kg is not None:
        fields.append(f"goal_weight_kg = ${len(values) + 1}")
        values.append(goal_weight_kg)
    if height_cm is not None:
        fields.append(f"height_cm = ${len(values) + 1}")
        values.append(height_cm)
    if age is not None:
        fields.append(f"age = ${len(values) + 1}")
        values.append(age)
    if sex is not None:
        fields.append(f"sex = ${len(values) + 1}")
        values.append(sex)
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
