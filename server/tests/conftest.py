import os

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

REQUIRED_ENV = {
    "DATABASE_URL": "postgresql://test:test@localhost:5432/test",
    "JWT_SECRET": "test-jwt-secret-do-not-use-in-prod",
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
