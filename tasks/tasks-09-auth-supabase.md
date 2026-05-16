# Task 09 — Supabase Auth (FE + BE Python)

## Goal

Wire Supabase email/password auth. FE: signup, login, logout, `useAuth` hook. BE: FastAPI dependency verifies Supabase JWT on protected routes. On first login, upsert user row into local `users` table.

## Prereqs

- Tasks 02 (router), 07 (server), 08 (db)
- Supabase project created per CLAUDE.md § Step 2

## Install

```bash
# Client
cd /home/sahil/runner/client
npm install @supabase/supabase-js

# Server
cd /home/sahil/runner/server
source .venv/bin/activate
pip install "python-jose[cryptography]" httpx
pip freeze > requirements.txt
```

## FE files

(Unchanged from prior plan — frontend stack still React.)

| Path | Purpose |
|------|---------|
| `client/src/lib/supabase.js` | `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` singleton |
| `client/src/hooks/useAuth.js` | Wraps `supabase.auth`. Exports `{user, session, signIn, signUp, signOut, loading}`. Subscribes to `onAuthStateChange`. |
| `client/src/components/auth/AuthProvider.jsx` | Context provider |
| `client/src/components/auth/SignInForm.jsx` | Email/password form |
| `client/src/components/auth/SignUpForm.jsx` | Email/password + username |
| `client/src/routes/Auth.jsx` | `/auth` route hosting both forms (tab toggle) |
| `client/src/components/auth/ProtectedRoute.jsx` | Wrapper redirects to `/auth` if no session |
| `client/src/lib/api.js` | Fetch wrapper attaching `Authorization: Bearer ${session.access_token}` |

Update `App.jsx` to wrap routes in `<AuthProvider>`. Protect `/dashboard`, `/battlefield`, `/leaderboard`.

## BE files

| Path | Purpose |
|------|---------|
| `server/app/deps.py` | FastAPI dependencies: `get_db_pool`, `get_current_user`. `get_current_user` reads `Authorization` header, decodes JWT via `python-jose` using `settings.supabase_jwt_secret` (HS256) OR JWKS (RS256) — pick HS256 for MVP; raise `HTTPException(401)` on missing/invalid. Returns `User(id, email)` pydantic model. |
| `server/app/routers/auth.py` | `POST /auth/sync-profile` (auth required) — body: `{username}`. Upserts user row in local DB. Returns local user record. `GET /auth/me` — returns local user record. |
| `server/app/services/user_service.py` | `upsert_user(pool, supabase_id: UUID, email: str, username: str) -> User` |
| `server/app/schemas/user.py` | pydantic `User`, `UserCreate`, `AuthClaims` |

Register `auth` router in `app/main.py`.

## deps.py auth skeleton

```python
from fastapi import Depends, Header, HTTPException, status
from jose import jwt, JWTError
from app.config import get_settings
from app.schemas.user import AuthClaims

async def get_current_user(authorization: str | None = Header(None)) -> AuthClaims:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {e}")
    return AuthClaims(id=payload["sub"], email=payload.get("email", ""))
```

## Env updates

Client `.env`:
```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Server `.env`:
```
SUPABASE_URL=...
SUPABASE_JWT_SECRET=...   # HS256 secret from Supabase project settings → API → JWT Secret
```

## Tests

| Path | Purpose |
|------|---------|
| `server/tests/test_auth.py` | `GET /auth/me` w/o token → 401. With valid HS256 token signed by `SUPABASE_JWT_SECRET` (fixture) → 200. Invalid signature → 401. |
| `server/tests/test_user_service.py` | Insert + idempotent upsert |

Use `pytest` fixture to mint a fake JWT with the test secret.

## Acceptance

- Sign up via `/auth` → user row appears in Supabase Auth table
- Login → session persists across reload (localStorage)
- Protected route redirect: visiting `/dashboard` while logged out → `/auth`
- `GET /auth/me` returns 401 w/o token, 200 with valid token
- First successful `POST /auth/sync-profile` creates row in local `users` table
- `pytest -v` → green

## Out of scope

- OAuth providers — email/password only for MVP
- Password reset UI — Supabase default email link OK
- RS256/JWKS verification (use HS256 for MVP)
