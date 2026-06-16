import pytest


@pytest.mark.asyncio
async def test_health_endpoint(async_client):
    resp = await async_client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "analytics-api"


@pytest.mark.asyncio
async def test_health_method_not_allowed(async_client):
    resp = await async_client.post("/health")
    assert resp.status_code == 405


@pytest.mark.asyncio
async def test_health_response_headers(async_client):
    resp = await async_client.get("/health")
    assert resp.headers.get("content-type") == "application/json"
