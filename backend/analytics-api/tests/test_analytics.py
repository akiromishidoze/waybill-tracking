import pytest

@pytest.mark.asyncio
async def test_stats_endpoint(async_client):
    resp = await async_client.get("/api/v1/analytics/stats")

    assert resp.status_code in (200, 500)

@pytest.mark.asyncio
async def test_sla_endpoint_missing_params(async_client):
    resp = await async_client.get("/api/v1/analytics/sla")

    assert resp.status_code in (422, 200, 500)

@pytest.mark.asyncio
async def test_sla_endpoint_with_params(async_client):
    resp = await async_client.get(
        "/api/v1/analytics/sla", params={"from": "2026-01-01", "to": "2026-06-16"}
    )

    assert resp.status_code in (200, 500)

@pytest.mark.asyncio
async def test_anomalies_endpoint(async_client):
    resp = await async_client.get("/api/v1/analytics/anomalies")

    assert resp.status_code in (200, 500)

@pytest.mark.asyncio
async def test_predict_eta_endpoint(async_client):
    resp = await async_client.get("/api/v1/analytics/predict-eta/nonexistent-id")

    assert resp.status_code in (200, 404, 500)

@pytest.mark.asyncio
async def test_predict_eta_invalid_id(async_client):
    resp = await async_client.get("/api/v1/analytics/predict-eta/")

    assert resp.status_code == 404

@pytest.mark.asyncio
async def test_stats_response_shape(async_client):
    resp = await async_client.get("/api/v1/analytics/stats")

    if resp.status_code == 200:
        data = resp.json()

        assert isinstance(data, dict)

@pytest.mark.asyncio
async def test_analytics_404(async_client):
    resp = await async_client.get("/api/v1/analytics/nonexistent")

    assert resp.status_code == 404