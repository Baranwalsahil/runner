import importlib

import pytest
from pydantic import ValidationError


def test_missing_required_env_raises(monkeypatch, tmp_path):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.chdir(tmp_path)

    import app.config as config_module

    importlib.reload(config_module)
    config_module.get_settings.cache_clear()

    with pytest.raises(ValidationError) as excinfo:
        config_module.get_settings()

    msg = str(excinfo.value)
    assert "DATABASE_URL" in msg
    assert "JWT_SECRET" in msg


def test_defaults(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://a:b@h/db")
    monkeypatch.setenv("JWT_SECRET", "secret-32-bytes")
    monkeypatch.delenv("PORT", raising=False)
    monkeypatch.delenv("H3_RESOLUTION", raising=False)
    monkeypatch.delenv("JWT_ALGORITHM", raising=False)
    monkeypatch.delenv("JWT_EXPIRES_SECONDS", raising=False)

    import app.config as config_module

    config_module.get_settings.cache_clear()
    s = config_module.get_settings()
    assert s.port == 8000
    assert s.h3_resolution == 9
    assert s.node_env == "development"
    assert s.redis_url is None
    assert s.jwt_algorithm == "HS256"
    assert s.jwt_expires_seconds == 604800
    assert s.supabase_url is None
