# Task 09 — Own JWT Auth (FastAPI + React, no third-party IdP)

## Goal

Self-hosted email/password auth. FastAPI signs HS256 JWTs with server-held
secret. `users.password_hash` stores bcrypt hash. No Supabase Auth, no
Auth0, no Clerk. Client stores token in `localStorage`, attaches as
`Authorization: Bearer <token>` on API calls.

## Why own auth

- No vendor lock-in. JWT format is standard; portable.
- Free tier limits irrelevant — scales with our infra.
- Schema control: `password_hash` lives next to `users.email` already.
- Smaller dependency surface (`python-jose` + `passlib[bcrypt]` only).

## Prereqs

- Task 07 done (FastAPI scaffold)
- Task 08 done (users table includes `password_hash VARCHAR(255) NOT NULL`)

## Install

```bash
# Server
cd /home/sahil/runner/server
source .venv/bin/activate
pip install "python-jose[cryptography]" "passlib[bcrypt]" "email-validator"
pip freeze > requirements.txt
```

No new client deps — fetch + localStorage only.

## Env (server/.env)

```
JWT_SECRET=<openssl rand -hex 32>
JWT_ALGORITHM=HS256
JWT_EXPIRES_SECONDS=604800   # 7 days
```

Already wired into `app/config.py` as required field `jwt_secret` + defaults.

## BE files

| Path | Purpose |
|------|---------|
| `server/app/services/auth_service.py` | `hash_password(plain) -> str` (bcrypt), `verify_password(plain, hashed) -> bool`, `issue_token(user_id: UUID, email: str) -> str` (HS256, exp=now+jwt_expires_seconds, claims: sub, email, iat, exp), `decode_token(token) -> dict` (raises 401 on invalid/expired) |
| `server/app/services/user_service.py` | `create_user(pool, email, username, password_hash) -> User`, `get_user_by_email(pool, email) -> User \| None`, `get_user_by_id(pool, user_id) -> User \| None`. Raise `UserAlreadyExists` on unique violation. |
| `server/app/deps.py` | `get_db_pool()` returns `asyncpg.Pool` (await get_pool); `get_current_user(authorization: str = Header(None), pool = Depends(get_db_pool)) -> User` — decode bearer JWT, load user row, raise 401 on missing/invalid/user-deleted. |
| `server/app/routers/auth.py` | `POST /auth/signup` `{email, username, password}` → 201 `{user, token}`; `POST /auth/login` `{email, password}` → 200 `{user, token}` (401 on bad creds — generic "Invalid credentials" message, no enumeration); `GET /auth/me` → 200 current user; `POST /auth/logout` → 204 (stateless, client just discards token). |
| `server/app/schemas/auth.py` | `SignupRequest`, `LoginRequest`, `AuthResponse {user, token}`, `User {id, email, username, avatar_url, total_cells, total_area_m2, created_at}` |

Register router in `app/main.py`: `app.include_router(auth.router)`.

## FE files

| Path | Purpose |
|------|---------|
| `client/src/lib/auth.js` | `saveToken(t)`, `getToken()`, `clearToken()` (localStorage key `tr_token`); `apiFetch(path, opts)` wrapper auto-attaches `Authorization: Bearer ${getToken()}`, 401 → clear token + redirect `/auth`. |
| `client/src/hooks/useAuth.js` | Context-backed hook: `{user, token, signIn, signUp, signOut, loading}`. On mount: if token exists call `GET /auth/me`, hydrate user. |
| `client/src/components/auth/AuthProvider.jsx` | Context provider wrapping `<App>` |
| `client/src/components/auth/SignInForm.jsx` | Email + password form, `signIn` on submit, error toast on 401 |
| `client/src/components/auth/SignUpForm.jsx` | Email + username + password form, `signUp` on submit |
| `client/src/routes/Auth.jsx` | `/auth` route, tab toggle signin/signup |
| `client/src/components/auth/ProtectedRoute.jsx` | Reads `useAuth`; loading → spinner, no user → `<Navigate to="/auth" replace />` |

Update `App.jsx`: wrap `<Routes>` in `<AuthProvider>`. Protect `/dashboard`, `/battlefield`, `/leaderboard`.

## auth_service.py skeleton

```python
from datetime import datetime, timedelta, timezone
from uuid import UUID

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config import get_settings

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_ctx.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


def issue_token(user_id: UUID, email: str) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=settings.jwt_expires_seconds)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as e:
        from fastapi import HTTPException, status
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {e}")
```

## deps.py skeleton

```python
from fastapi import Depends, Header, HTTPException, status
from uuid import UUID

from app.db.pool import get_pool
from app.services import auth_service, user_service


async def get_db_pool():
    return await get_pool()


async def get_current_user(
    authorization: str | None = Header(None),
    pool=Depends(get_db_pool),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    payload = auth_service.decode_token(token)
    user = await user_service.get_user_by_id(pool, UUID(payload["sub"]))
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer exists")
    return user
```

## Security notes

- **Password rules**: min 8 chars, enforced in `SignupRequest` validator. No max — bcrypt truncates at 72 bytes, document but allow longer input.
- **Bcrypt cost**: passlib default (12). Tune in prod if signup latency hurts.
- **Token storage**: localStorage. XSS risk understood — CSP later. Cookie+CSRF is a future tradeoff if needed.
- **Generic 401**: "Invalid credentials" on both bad email and bad password — no enumeration.
- **Rate limiting**: out of scope; add via reverse proxy or `slowapi` later.
- **HTTPS only in prod**: enforced by Render/Vercel TLS termination.
- **JWT secret rotation**: not implemented. Rotating invalidates all sessions. Acceptable for MVP.

## Tests

| Path | Purpose |
|------|---------|
| `server/tests/test_auth_service.py` | `hash_password` produces distinct hashes; `verify_password` round-trip; `issue_token` + `decode_token` round-trip; expired token raises 401; tampered signature raises 401. Pure unit, no DB. |
| `server/tests/test_auth_routes.py` | Integration. Requires `TEST_DATABASE_URL`. `POST /auth/signup` creates row + returns token; duplicate email → 409; `POST /auth/login` valid → token; bad password → 401; `GET /auth/me` without token → 401, with token → user; expired token → 401. |

Skip integration cleanly when `TEST_DATABASE_URL` unset (same pattern as task-08).

## Acceptance

- `POST /auth/signup {email, username, password}` → 201, user row created with bcrypt `password_hash`, JWT returned
- `POST /auth/login` with right creds → 200 + token; wrong → 401 generic
- `GET /auth/me` w/o token → 401; with valid → user JSON
- Token decoded server-side via HS256 with `JWT_SECRET`
- FE: `/auth` signup → redirected to `/dashboard`, token in localStorage, attached on subsequent requests
- ProtectedRoute redirect: `/dashboard` while logged out → `/auth`
- Logout → token cleared, `/auth/me` rejected
- `pytest -v` → green; integration tests skip cleanly w/o `TEST_DATABASE_URL`

## Out of scope

- OAuth/social login
- Password reset email flow (manual DB update for MVP; add later via email link + short-lived reset token)
- Email verification (trust on signup; revisit if spam)
- Refresh tokens (single long-lived 7-day JWT for MVP; rotate on login)
- RBAC / roles
- 2FA
