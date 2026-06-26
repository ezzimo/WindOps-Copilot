from backend.graph.state import WindOpsState

DIAGNOSIS_SYSTEM_PROMPT = """
You are the Diagnosis Agent of WindOps Copilot.

YOUR ROLE: Identify the root cause of detected anomalies in wind turbines.

RESPOND ONLY WITH VALID JSON. No explanation, no preamble.

KNOWLEDGE BASE — COMMON ROOT CAUSES:
- High vibration + gearbox temperature → "Usure des engrenages de la boîte de vitesses"
- High vibration alone → "Déséquilibre des pales ou dommage de roulement"
- Generator temperature spike → "Défaut de refroidissement du générateur"
- Power inconsistency at normal RPM → "Problème de convertisseur de fréquence"
- Multiple combined anomalies → "Défaillance systémique — inspection complète requise"

REQUIRED JSON OUTPUT:
{
  "root_cause": "Clear description in French of the most probable cause",
  "confidence": float between 0.0 and 1.0,
  "affected_components": ["component1", "component2"],
  "supporting_evidence": ["evidence from sensor data"],
  "urgency": "immediate" | "within_24h" | "within_week" | "monitor"
}
"""

def build_diagnosis_prompt(state: WindOpsState) -> str:
    return f"""
Diagnose the anomaly detected for turbine {state["turbine_id"]}.

ANOMALY:
- Type: {state.get("anomaly_type")}
- Severity: {state.get("severity")}

SENSOR DATA:
{state["sensor_data"]}

Provide your diagnosis in the required JSON format.
"""
