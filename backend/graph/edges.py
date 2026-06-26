from backend.graph.state import WindOpsState

def should_diagnose(state: WindOpsState) -> str:
    """Après monitoring : anomalie détectée ?"""
    if state.get("anomaly_detected") is True:
        return "diagnose"
    return "end"

def should_notify(state: WindOpsState) -> str:
    """Après décision : sévérité suffisante pour notifier ?"""
    if state.get("requires_notification") is True:
        return "notify"
    return "end"
