import pytest


@pytest.mark.anyio
async def test_health_check(client):
    r = await client.get("/health")
    assert r.status_code == 200


@pytest.mark.anyio
async def test_telemetry_missing_field(client):
    r = await client.post("/api/telemetry", json={"turbine_id": "T-001"})
    assert r.status_code == 422


@pytest.mark.anyio
async def test_get_turbines(client):
    r = await client.get("/api/turbines")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.anyio
async def test_get_alerts(client):
    r = await client.get("/api/alerts")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.anyio
async def test_get_incidents(client):
    r = await client.get("/api/incidents")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.anyio
async def test_get_metrics_structure(client):
    r = await client.get("/api/metrics")
    assert r.status_code == 200
    data = r.json()
    for key in ["total_turbines", "avg_health_score", "agents", "incidents_today"]:
        assert key in data
    assert isinstance(data["agents"], list)


@pytest.mark.anyio
async def test_get_emails(client):
    r = await client.get("/api/emails")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.anyio
async def test_get_report_not_found(client):
    r = await client.get("/api/reports/nonexistent-id")
    assert r.status_code == 404
