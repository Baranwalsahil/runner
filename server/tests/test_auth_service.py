from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from fastapi import HTTPException
from jose import jwt

from app.services import auth_service


def test_hash_password_distinct_per_call():
    h1 = auth_service.hash_password("secret123")
    h2 = auth_service.hash_password("secret123")
    assert h1 != h2  # bcrypt salts


def test_verify_password_round_trip():
    h = auth_service.hash_password("secret123")
    assert auth_service.verify_password("secret123", h) is True
    assert auth_service.verify_password("wrong", h) is False


def test_verify_password_handles_malformed_hash():
    assert auth_service.verify_password("x", "not-a-bcrypt-hash") is False


def test_hash_password_rejects_over_72_bytes():
    with pytest.raises(HTTPException) as ei:
        auth_service.hash_password("a" * 73)
    assert ei.value.status_code == 400


def test_issue_and_decode_token_round_trip():
    uid = uuid4()
    token = auth_service.issue_token(uid, "x@example.com")
    payload = auth_service.decode_token(token)
    assert payload["sub"] == str(uid)
    assert payload["email"] == "x@example.com"
    assert "iat" in payload and "exp" in payload


def test_expired_token_raises_401(monkeypatch):
    from app.config import get_settings

    settings = get_settings()
    expired = jwt.encode(
        {
            "sub": str(uuid4()),
            "email": "x@example.com",
            "iat": int(time.time()) - 7200,
            "exp": int(time.time()) - 3600,
        },
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    with pytest.raises(HTTPException) as ei:
        auth_service.decode_token(expired)
    assert ei.value.status_code == 401


def test_tampered_signature_raises_401():
    uid = uuid4()
    token = auth_service.issue_token(uid, "x@example.com")
    # flip a character in the signature segment
    head, payload, sig = token.split(".")
    bad = ".".join([head, payload, sig[:-1] + ("A" if sig[-1] != "A" else "B")])
    with pytest.raises(HTTPException) as ei:
        auth_service.decode_token(bad)
    assert ei.value.status_code == 401


def test_wrong_secret_raises_401():
    uid = uuid4()
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {
            "sub": str(uid),
            "email": "x@example.com",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(hours=1)).timestamp()),
        },
        "different-secret",
        algorithm="HS256",
    )
    with pytest.raises(HTTPException) as ei:
        auth_service.decode_token(token)
    assert ei.value.status_code == 401
