import pytest
from unittest.mock import AsyncMock, patch

NORMAL_PAYLOAD = {
    "turbine_id": "T-001",
    "correlation_id": "test-normal-001",
    "timestamp": "2024-01-01T00:00:00",
    "wind_speed": 12.5,
    "rotor_rpm": 15.0,
    "power_output": 750.0,
    "temperature_gearbox": 65.0,
    "temperature_generator": 72.0,
    "vibration_level": 5.0,
    "blade_pitch_angle": 15.0,
}

CRITICAL_PAYLOAD = {
    **NORMAL_PAYLOAD,
    "correlation_id": "test-critical-001",
    "vibration_level": 22.0,
    "temperature_gearbox": 91.0,
    "temperature_generator": 97.0,
}

MOCK_MONITORING_NORMAL = '{"anomaly_detected": false, "anomaly_type": "none", "severity": "low", "health_score": 0.95, "threshold_violations": [], "observation": "Fonctionnement normal."}'

MOCK_MONITORING_CRITICAL = '{"anomaly_detected": true, "anomaly_type": "multiple", "severity": "critical", "health_score": 0.22, "threshold_violations": [{"sensor": "vibration_level", "value": 22.0, "threshold": 18.0, "level": "critical"}], "observation": "Anomalie critique détectée."}'

MOCK_DIAGNOSIS = '{"root_cause": "Usure des engrenages", "confidence": 0.88, "affected_components": ["gearbox"], "supporting_evidence": ["vibration 22 mm/s"], "urgency": "immediate"}'

MOCK_DECISION = '{"recommended_action": "Arrêt préventif pour inspection", "reasoning": "Sévérité critique.", "estimated_cost_eur": 5000, "estimated_downtime_hours": 8, "requires_human_validation": true, "confidence": 0.85}'


def _mock_llm(content):
    mock_llm = AsyncMock()
    mock_llm.ainvoke.return_value = AsyncMock(
        content=content,
        usage_metadata={"total_tokens": 100},
    )
    return mock_llm


@pytest.mark.anyio
async def test_pipeline_normal_no_anomaly():
    with patch(
        "backend.agents.monitoring.agent.get_llm",
        return_value=_mock_llm(MOCK_MONITORING_NORMAL),
    ):
        from backend.graph.graph import run_pipeline

        result = await run_pipeline(NORMAL_PAYLOAD)

    assert result["anomaly_detected"] is False
    assert result["health_score"] > 0.7
    assert "monitoring" in result["agents_triggered"]
    assert result.get("diagnosis") is None or result.get("root_cause") is None


@pytest.mark.anyio
async def test_pipeline_critical_full_flow():
    with (
        patch(
            "backend.agents.monitoring.agent.get_llm",
            return_value=_mock_llm(MOCK_MONITORING_CRITICAL),
        ),
        patch(
            "backend.agents.diagnosis.agent.get_llm",
            return_value=_mock_llm(MOCK_DIAGNOSIS),
        ),
        patch(
            "backend.agents.decision.agent.get_llm",
            return_value=_mock_llm(MOCK_DECISION),
        ),
        patch("backend.agents.notification.agent.gmail_service") as m4,
        patch("backend.agents.notification.agent.repo") as m5,
        patch("backend.agents.notification.agent.alert_repo") as m6,
    ):
        m4.send_alert = AsyncMock(return_value=True)
        m5.create = AsyncMock(return_value="INC-TEST-001")
        m6.create = AsyncMock(return_value="ALT-TEST-001")

        from backend.graph.graph import run_pipeline

        result = await run_pipeline(CRITICAL_PAYLOAD)

    assert result["anomaly_detected"] is True
    assert result["severity"] == "critical"
    assert result["requires_notification"] is True
    assert result["notification_sent"] is True
    all_agents = ["supervisor", "monitoring", "diagnosis", "decision", "notification"]
    for agent in all_agents:
        assert agent in result["agents_triggered"]
