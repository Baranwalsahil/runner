import importlib

import pytest
from pydantic import ValidationError


def test_missing_required_env_raises(monkeypatch, tmp_path):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_ANON_KEY", raising=False)
    monkeypatch.delenv("SUPABASE_JWT_SECRET", raising=False)
    monkeypatch.chdir(tmp_path)

    import app.config as config_module

    importlib.reload(config_module)
    config_module.get_settings.cache_clear()

    with pytest.raises(ValidationError) as excinfo:
        config_module.get_settings()

    msg = str(excinfo.value)
    assert "DATABASE_URL" in msg
    assert "SUPABASE_URL" in msg


def test_defaults(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://a:b@h/db")
    monkeypatch.setenv("SUPABASE_URL", "https://x.supabase.co")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "anon")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "secret")
    monkeypatch.delenv("PORT", raising=False)
    monkeypatch.delenv("H3_RESOLUTION", raising=False)

    import app.config as config_module

    config_module.get_settings.cache_clear()
    s = config_module.get_settings()
    assert s.port == 8000
    assert s.h3_resolution == 9
    assert s.node_env == "development"
    assert s.redis_url is None
