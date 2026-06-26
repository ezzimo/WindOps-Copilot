import time

from langgraph.graph import StateGraph, END
from backend.graph.state import WindOpsState
from backend.graph.edges import should_diagnose, should_notify

# Import nodes from agents
from backend.agents.supervisor.agent import supervisor
from backend.agents.monitoring.agent import monitoring
from backend.agents.diagnosis.agent import diagnosis
from backend.agents.decision.agent import decision
from backend.agents.notification.agent import notification

# Private singleton instance for the compiled graph
_compiled_graph = None

def get_graph():
    """
    Returns the compiled LangGraph singleton instance.
    Constructs and compiles the graph if it has not been initialized.
    """
    global _compiled_graph
    if _compiled_graph is None:
        # Initialize StateGraph with WindOpsState schema
        workflow = StateGraph(WindOpsState)
        
        # Register nodes
        workflow.add_node("supervisor", supervisor)
        workflow.add_node("monitoring", monitoring)
        workflow.add_node("diagnosis", diagnosis)
        workflow.add_node("decision", decision)
        workflow.add_node("notification", notification)
        
        # Define execution flow
        
        # 1. Entry point is the supervisor agent
        workflow.set_entry_point("supervisor")
        
        # 2. supervisor transitions unconditionally to monitoring
        workflow.add_edge("supervisor", "monitoring")
        
        # 3. After monitoring, routing is determined conditionally
        workflow.add_conditional_edges(
            "monitoring",
            should_diagnose,
            {
                "diagnose": "diagnosis",
                "end": END
            }
        )
        
        # 4. If diagnosed, transition to decision agent
        workflow.add_edge("diagnosis", "decision")
        
        # 5. After decision, routing is determined conditionally
        workflow.add_conditional_edges(
            "decision",
            should_notify,
            {
                "notify": "notification",
                "end": END
            }
        )
        
        # 6. If notified, transition to END
        workflow.add_edge("notification", END)
        
        # Compile the graph
        _compiled_graph = workflow.compile()
        
    return _compiled_graph

async def run_pipeline(payload: dict) -> dict:
    """
    Initializes the state from the payload and runs the LangGraph pipeline asynchronously.
    Uses the compiled singleton graph.
    
    Args:
        payload (dict): The incoming telemetry payload and initial metadata.
        
    Returns:
        dict: The final state of the pipeline after running all triggered agents.
    """
    # Extract keys and fallback to default initial state values
    initial_state = {
        "pipeline_start_time": time.time(),
        "correlation_id": payload.get("correlation_id", ""),
        "turbine_id": payload.get("turbine_id", ""),
        "sensor_data": payload.get("sensor_data", {}),
        
        # Agent results initialized to defaults or overrides
        "health_score": payload.get("health_score", None),
        "anomaly_detected": payload.get("anomaly_detected", None),
        "anomaly_type": payload.get("anomaly_type", None),
        "severity": payload.get("severity", None),
        "root_cause": payload.get("root_cause", None),
        "confidence": payload.get("confidence", None),
        "affected_components": payload.get("affected_components", None),
        "recommended_action": payload.get("recommended_action", None),
        "requires_human_validation": payload.get("requires_human_validation", False),
        
        # Flow control
        "requires_notification": payload.get("requires_notification", False),
        "notification_sent": payload.get("notification_sent", False),
        "alert_id": payload.get("alert_id", None),
        "incident_id": payload.get("incident_id", None),
        "report_id": payload.get("report_id", None),
        
        # Observability (reducing keys start empty)
        "agents_triggered": payload.get("agents_triggered", []),
        "agent_trace": payload.get("agent_trace", []),
        "error_messages": payload.get("error_messages", [])
    }
    
    # Retrieve the compiled graph singleton
    graph = get_graph()
    
    try:
        # Run the compiled graph asynchronously
        final_state = await graph.ainvoke(initial_state)
        return final_state
    except Exception as e:
        print(f"[Pipeline Error] LangGraph execution failed: {e}")
        # Append exception message to error trace
        initial_state["error_messages"].append(str(e))
        return initial_state
