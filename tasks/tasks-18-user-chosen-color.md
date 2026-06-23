# Task 18 — User-chosen territory color at signup

**Layer:** FE + BE · **Effort:** M · **Prereqs:** tasks 09 (auth/users), 11 (territory API), 12 (leaderboard), task-09 signup flow

## Goal

Let a new user **pick their territory color** during signup. The chosen
color is stored on the `users` row and used to render that user's owned
hexagons on the **Dashboard** and **Battlefield** map (and the color chip
on the **Leaderboard**), replacing the current UUID-derived color for that
user.

Today every user's color is **derived** deterministically from their UUID
(`server/app/services/color.py` → `color_for_uuid`, indexing
`OWNER_PALETTE`). This task makes the color a **stored, user-selected**
value, with the UUID-derived color as the fallback when a row has no stored
color.

## Decisions (locked)

| Question | Choice |
|----------|--------|
| Picker type | **Full hex color picker** — native `<input type="color">`, any hex color |
| Uniqueness | **Unique per user** — a color taken by another user is rejected (409) |
| Editable later | **Signup-only** for now (no profile edit this round) |
| Existing users | **Backfill** every existing row to a deterministic near-unique hex (`md5(id)`) so a UNIQUE index can be added |
| Validation | Server validates `#rrggbb` hex format (422); DB UNIQUE index enforces uniqueness (race-safe) |
| Fallback | NULL color (e.g. seeded/legacy rows) falls back to `color_for_uuid`; multiple NULLs allowed by the unique index |

## Files touched

**Backend**
- `server/migrations/007_user_color.sql` — `ALTER TABLE users ADD COLUMN color VARCHAR(7);` + backfill existing rows to derived color (pure-SQL md5 mod over palette array, mirroring `color_for`).
- `server/app/schemas/auth.py` — `SignupRequest.color: str` (validated against `OWNER_PALETTE`); add `color: str | None` to the `User` model.
- `server/app/routers/auth.py` — pass `color` through to `create_user`.
- `server/app/services/user_service.py` — `create_user(..., color)`; add `color` to `_SELECT_COLUMNS` and `_row_to_user`.
- `server/app/services/territory_service.py` — select stored `users.color`; use `stored or color_for_uuid(uid)`.
- `server/app/services/leaderboard_service.py` — same fallback pattern.

**Frontend**
- `client/src/components/auth/SignUpForm.jsx` — palette swatch picker (radio group), default first color, pass `color` to `signUp`.
- `client/src/hooks/useAuth.js` + `client/src/components/auth/AuthProvider.jsx` — thread `color` through `signUp`.
- `client/src/lib/api.js` — include `color` in signup POST body.
- Rendering (`mapStyle.js`, `h3Utils.js`, Dashboard, Battlefield, Leaderboard) **unchanged** — they already consume the API `color` field.

## Implementation notes

- **Backfill SQL** (palette is 1-indexed in Postgres arrays):
  ```sql
  UPDATE users SET color = (ARRAY[
    '#c3f400','#00dbe9','#ffb4aa','#7df4ff','#ffdad5','#ff6b6b'
  ])[(('x'||substr(md5(id::text),1,8))::bit(32)::bigint % 6) + 1]
  WHERE color IS NULL;
  ```
  This mirrors `color_for` (md5 of id → first 8 hex → mod len(palette)).
- New signups always send a color, so new rows are never null. Fallback
  still applies in read services for safety.
- Keep `color_for_uuid` — it's the documented fallback, not dead code.

## Acceptance criteria

- [ ] Signup screen shows a native color picker defaulting to a color; the user can pick any hex color.
- [ ] Signing up with a chosen color stores it on the `users` row; `GET /auth/me` returns it (lowercased).
- [ ] Server rejects a malformed `color` (not `#rrggbb`) with 422.
- [ ] Signing up with a color already owned by another user returns 409.
- [ ] New user's owned hexes render in the chosen color on Dashboard + Battlefield; leaderboard chip matches.
- [ ] BE tests (`pytest`) + FE tests (`vitest`) green; signup form test covers custom color + uniqueness 409.
- [ ] Chrome flow verified: sign up a fresh user with a custom color, confirm their cells render that color on the map.

## Out of scope

- Editing color after signup (profile/settings screen).
- Free/custom hex colors beyond the preset palette.
- Recoloring already-claimed cells retroactively beyond what the owner-color render already does.
