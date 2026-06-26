import json
import re
from langchain_core.messages import SystemMessage, HumanMessage
from backend.llm import get_llm

from backend.graph.state import WindOpsState
from backend.agents.diagnosis.prompt import DIAGNOSIS_SYSTEM_PROMPT, build_diagnosis_prompt

async def diagnosis_node(state: WindOpsState) -> dict:
    """
    Diagnosis Agent node function.
    Identifies the root cause of detected turbine anomalies.
    """
    turbine_id = state.get("turbine_id", "unknown")
    try:
        # 1. Instanciate ChatOpenAI
        llm = get_llm(temperature=0.1)
        
        # 2. Appelle LLM
        messages = [
            SystemMessage(content=DIAGNOSIS_SYSTEM_PROMPT),
            HumanMessage(content=build_diagnosis_prompt(state))
        ]
        
        response = await llm.ainvoke(messages)
        content = response.content
        
        # 3. Parse le JSON
        data = None
        try:
            data = json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"(\{.*\})", content, re.DOTALL)
            if match:
                data = json.loads(match.group(1))
            else:
                raise ValueError(f"Failed to parse JSON from response: {content}")
                
        # 4. Extrait : root_cause, confidence, affected_components
        root_cause = data.get("root_cause", "Cause indéterminée")
        confidence = float(data.get("confidence", 0.5))
        affected_components = data.get("affected_components", [])
        
        # 5. Log
        print(f"[Diagnosis] turbine={turbine_id} root_cause='{root_cause}' confidence={confidence}")
        
        # 6. Trace & Update
        trace_entry = {
            "agent": "diagnosis",
            "status": "success",
            "message": f"Diagnostic : {root_cause} (Confiance: {confidence}). Composants affectés: {', '.join(affected_components)}"
        }
        
        return {
            "root_cause": root_cause,
            "confidence": confidence,
            "affected_components": affected_components,
            "agents_triggered": ["diagnosis"],
            "agent_trace": [trace_entry]
        }
        
    except Exception as e:
        # 7. Error handling
        error_msg = f"Exception in diagnosis agent for turbine {turbine_id}: {str(e)}"
        print(f"[Diagnosis Error] {error_msg}")
        
        trace_entry = {
            "agent": "diagnosis",
            "status": "failed",
            "message": f"Execution failed: {str(e)}"
        }
        
        return {
            "root_cause": "Erreur lors de l'établissement du diagnostic",
            "confidence": 0.0,
            "affected_components": [],
            "agents_triggered": ["diagnosis"],
            "agent_trace": [trace_entry],
            "error_messages": [error_msg]
        }

# Set alias to match graph imports
diagnosis = diagnosis_node
