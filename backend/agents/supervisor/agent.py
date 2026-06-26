from backend.graph.state import WindOpsState

async def supervisor_node(state: WindOpsState) -> dict:
    """
    Supervisor Agent node function.
    Prepares the context before analysis (without LLM) and validates input sensor fields.
    """
    correlation_id = state.get("correlation_id", "unknown")
    turbine_id = state.get("turbine_id", "unknown")
    
    # 1. Log the pipeline startup
    print(f"[Supervisor] Pipeline started correlation_id={correlation_id}")
    
    # 2. Check if sensor_data contains all required fields
    required_fields = [
        "wind_speed",
        "rotor_rpm",
        "power_output",
        "temperature_gearbox",
        "temperature_generator",
        "vibration_level",
        "blade_pitch_angle"
    ]
    
    sensor_data = state.get("sensor_data", {})
    missing_fields = []
    
    for field in required_fields:
        if field not in sensor_data or sensor_data[field] is None:
            missing_fields.append(field)
            
    error_messages = []
    if missing_fields:
        error_msg = f"[Validation Warning] Missing required sensor fields for turbine {turbine_id}: {', '.join(missing_fields)}"
        print(error_msg)
        error_messages.append(error_msg)
        
    # 3. Create trace entry
    trace_entry = {
        "agent": "supervisor",
        "status": "success" if not missing_fields else "warning",
        "message": f"Pipeline context prepared. Missing fields: {len(missing_fields)}"
    }
    
    # Return updates
    return {
        "agents_triggered": ["supervisor"],
        "agent_trace": [trace_entry],
        "error_messages": error_messages
    }

# Alias compatibility
supervisor = supervisor_node
