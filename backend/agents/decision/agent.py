import json
import re
from langchain_core.messages import SystemMessage, HumanMessage
from backend.llm import get_llm

from backend.graph.state import WindOpsState
from backend.agents.decision.prompt import DECISION_SYSTEM_PROMPT, build_decision_prompt

async def decision_node(state: WindOpsState) -> dict:
    """
    Decision Agent node function.
    Recommends the best operational action based on the diagnosis and severity.
    """
    turbine_id = state.get("turbine_id", "unknown")
    severity = state.get("severity", "low")
    
    try:
        # 1. Instanciate ChatOpenAI
        llm = get_llm(temperature=0.1)
        
        # 2. Appelle LLM
        messages = [
            SystemMessage(content=DECISION_SYSTEM_PROMPT),
            HumanMessage(content=build_decision_prompt(state))
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
                
        # 4. Extrait : recommended_action, requires_human_validation
        recommended_action = data.get("recommended_action", "Surveillance renforcée")
        requires_human_validation = data.get("requires_human_validation", True)
        reasoning = data.get("reasoning", "Recommandation générée par l'agent.")
        
        # 5. Détermine requires_notification = severity in ("high", "critical")
        requires_notification = severity in ("high", "critical")
        
        # 6. Log
        print(f"[Decision] turbine={turbine_id} recommended_action='{recommended_action}' requires_notification={requires_notification}")
        
        # 7. Trace & Update
        trace_entry = {
            "agent": "decision",
            "status": "success",
            "message": f"Action recommandée : {recommended_action}. Raison : {reasoning}. Notification requise : {requires_notification}"
        }
        
        return {
            "recommended_action": recommended_action,
            "requires_human_validation": requires_human_validation,
            "requires_notification": requires_notification,
            "agents_triggered": ["decision"],
            "agent_trace": [trace_entry]
        }
        
    except Exception as e:
        error_msg = f"Exception in decision agent for turbine {turbine_id}: {str(e)}"
        print(f"[Decision Error] {error_msg}")
        
        trace_entry = {
            "agent": "decision",
            "status": "failed",
            "message": f"Execution failed: {str(e)}"
        }
        
        return {
            "recommended_action": "Surveillance renforcée",
            "requires_human_validation": True,
            "requires_notification": severity in ("high", "critical"),
            "agents_triggered": ["decision"],
            "agent_trace": [trace_entry],
            "error_messages": [error_msg]
        }

# Set alias to match graph imports
decision = decision_node
