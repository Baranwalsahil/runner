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
| Picker type | **Preset palette** — the existing `OWNER_PALETTE` swatches (no free hex input) |
| Editable later | **Signup-only** for now (no profile edit this round) |
| Existing users | **Backfill** every existing row to its current UUID-derived color (stored as a real value) |
| Source of truth for palette | `shared/constants.js` / `server/app/constants.py` `OWNER_PALETTE` (already mirrored) |
| Validation | Server rejects any color not in `OWNER_PALETTE` |

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

- [ ] Signup screen shows a row of palette swatches; one is selected by default; selection is keyboard-accessible.
- [ ] Signing up with a chosen color stores it on the `users` row; `GET /auth/me` returns it.
- [ ] Server rejects a signup `color` not in `OWNER_PALETTE` (422).
- [ ] New user's owned hexes render in the chosen color on Dashboard + Battlefield; leaderboard chip matches.
- [ ] Existing (pre-migration) users keep their previous (now backfilled) color — no visual change for them.
- [ ] BE tests (`pytest`) + FE tests (`vitest`) green; signup form test covers color selection.
- [ ] Chrome flow verified: sign up a fresh user with a non-default color, confirm their cells render that color on the map.

## Out of scope

- Editing color after signup (profile/settings screen).
- Free/custom hex colors beyond the preset palette.
- Recoloring already-claimed cells retroactively beyond what the owner-color render already does.
