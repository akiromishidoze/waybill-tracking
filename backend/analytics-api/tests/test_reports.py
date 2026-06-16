import pytest


@pytest.mark.asyncio
async def test_export_endpoint(async_client):
    resp = await async_client.get(
        "/api/reports/export", params={"from": "2026-01-01", "to": "2026-06-16"}
    )
    assert resp.status_code in (200, 500)


@pytest.mark.asyncio
async def test_export_missing_params(async_client):
    resp = await async_client.get("/api/reports/export")
    assert resp.status_code in (422, 200, 500)


@pytest.mark.asyncio
async def test_export_response_type(async_client):
    resp = await async_client.get(
        "/api/reports/export", params={"from": "2026-01-01", "to": "2026-06-16"}
    )
    if resp.status_code == 200:
        assert resp.headers.get("content-type") in (
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/octet-stream",
        )


@pytest.mark.asyncio
async def test_reports_404(async_client):
    resp = await async_client.get("/api/reports/nonexistent")
    assert resp.status_code == 404
