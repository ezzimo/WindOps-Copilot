from typing import TypedDict, Optional, Annotated, List, Dict, Any
import operator

class WindOpsState(TypedDict):
    # --- Entrée ---
    correlation_id: str
    turbine_id: str
    sensor_data: dict          # TelemetryPayload sérialisé

    # --- Résultats des agents ---
    health_score: Optional[float]
    anomaly_detected: Optional[bool]
    anomaly_type: Optional[str]   # "high_vibration" | "temperature_spike" | "power_inconsistency" | "multiple"
    severity: Optional[str]       # "low" | "medium" | "high" | "critical"
    root_cause: Optional[str]
    confidence: Optional[float]
    affected_components: Optional[List[str]]
    recommended_action: Optional[str]
    requires_human_validation: bool

    # --- Contrôle de flux ---
    requires_notification: bool
    notification_sent: bool
    alert_id: Optional[str]
    incident_id: Optional[str]
    report_id: Optional[str]

    # --- Observabilité ---
    agents_triggered: Annotated[List[str], operator.add]
    agent_trace: Annotated[List[Dict[str, Any]], operator.add]
    error_messages: Annotated[List[str], operator.add]

    # --- Performance ---
    pipeline_start_time: Optional[float]
    duration_ms: Optional[float]
