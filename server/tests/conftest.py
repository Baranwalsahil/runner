import os

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

REQUIRED_ENV = {
    "DATABASE_URL": "postgresql://test:test@localhost:5432/test",
    "SUPABASE_URL": "https://test.supabase.co",
    "SUPABASE_ANON_KEY": "test-anon",
    "SUPABASE_JWT_SECRET": "test-secret",
}


@pytest.fixture(autouse=True)
def _env(monkeypatch):
    for k, v in REQUIRED_ENV.items():
        monkeypatch.setenv(k, v)
    monkeypatch.setenv("NODE_ENV", "development")
    yield


@pytest.fixture
def app():
    from app.config import get_settings

    get_settings.cache_clear()
    from app.main import create_app

    return create_app()


@pytest_asyncio.fixture
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
