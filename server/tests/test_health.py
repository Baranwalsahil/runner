import pytest


@pytest.mark.asyncio
async def test_health_ok(client):
    response = await client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "uptime" in body
    assert body["version"]


@pytest.mark.asyncio
async def test_health_uptime_increases(client):
    first = (await client.get("/health")).json()["uptime"]
    second = (await client.get("/health")).json()["uptime"]
    assert second >= first
