import json
import re
from langchain_core.messages import SystemMessage, HumanMessage
from backend.llm import get_llm
from backend.graph.state import WindOpsState
from backend.agents.monitoring.prompt import MONITORING_SYSTEM_PROMPT, build_monitoring_prompt

async def monitoring_node(state: WindOpsState) -> dict:
    """
    Monitoring Agent node function.
    Queries ChatOpenAI with the turbine sensor data and parses the anomaly report.
    """
    turbine_id = state.get("turbine_id", "unknown")
    sensor_data = state.get("sensor_data", {})
    
    try:
        # 1. Instanciate ChatOpenAI(model=settings.OPENAI_MODEL, temperature=0.1)
        llm = get_llm(temperature=0.1)
        
        # 2. Appelle LLM avec [SystemMessage(...), HumanMessage(...)]
        messages = [
            SystemMessage(content=MONITORING_SYSTEM_PROMPT),
            HumanMessage(content=build_monitoring_prompt(sensor_data))
        ]
        
        response = await llm.ainvoke(messages)
        content = response.content
        
        # 3. Parse le JSON de response.content (gérer JSONDecodeError avec regex fallback)
        data = None
        try:
            data = json.loads(content)
        except json.JSONDecodeError:
            # Fallback using regex to extract JSON structure if LLM outputs markdown formatting or text around it
            match = re.search(r"(\{.*\})", content, re.DOTALL)
            if match:
                data = json.loads(match.group(1))
            else:
                raise ValueError(f"Failed to parse JSON from response: {content}")
                
        # 4. Extrait : anomaly_detected, anomaly_type, severity, health_score
        anomaly_detected = data.get("anomaly_detected", False)
        anomaly_type = data.get("anomaly_type", "none")
        severity = data.get("severity", "low")
        health_score = float(data.get("health_score", 1.0))
        observation = data.get("observation", "Télémétrie analysée.")
        
        # 5. Log : f"[Monitoring] turbine={turbine_id} anomaly={anomaly_detected} severity={severity}"
        print(f"[Monitoring] turbine={turbine_id} anomaly={anomaly_detected} severity={severity}")
        
        # 6. Retourne le dict de mise à jour du state + entrée dans agent_trace + "monitoring" dans agents_triggered
        trace_entry = {
            "agent": "monitoring",
            "status": "success",
            "message": observation
        }
        
        return {
            "anomaly_detected": anomaly_detected,
            "anomaly_type": anomaly_type,
            "severity": severity,
            "health_score": health_score,
            "agents_triggered": ["monitoring"],
            "agent_trace": [trace_entry]
        }
        
    except Exception as e:
        # 7. Gestion d'erreur : si exception → retourne anomaly_detected=False, error dans error_messages, continue le pipeline
        error_msg = f"Exception in monitoring agent for turbine {turbine_id}: {str(e)}"
        print(f"[Monitoring Error] {error_msg}")
        
        trace_entry = {
            "agent": "monitoring",
            "status": "failed",
            "message": f"Execution failed: {str(e)}"
        }
        
        return {
            "anomaly_detected": False,
            "anomaly_type": "none",
            "severity": "low",
            "health_score": 1.0,
            "agents_triggered": ["monitoring"],
            "agent_trace": [trace_entry],
            "error_messages": [error_msg]
        }

# Set alias to match graph imports
monitoring = monitoring_node
