import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.database import get_db

class Incident(BaseModel):
    turbine_id: str
    correlation_id: str
    severity: str
    status: str = "open"
    root_cause: Optional[str] = None
    recommended_action: Optional[str] = None
    agents_involved: List[str] = Field(default_factory=list)
    incident_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    closed_at: Optional[str] = None
    health_score: Optional[float] = None
    duration_ms: Optional[float] = None
    report_id: Optional[str] = None
    agent_trace: List[dict] = Field(default_factory=list)
    agent_trace: Optional[List[Dict[str, Any]]] = None

class Alert(BaseModel):
    turbine_id: str
    severity: str
    message: str
    correlation_id: str
    alert_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    acknowledged: bool = False

# In-memory dictionaries for robust offline operations
in_memory_incidents = {}
in_memory_alerts = {}

class IncidentRepository:
    """
    Asynchronous repository for managing WindOps Incidents in MongoDB,
    with an automatic fallback to in-memory storage if MongoDB is offline.
    """
    async def create(self, incident: Incident) -> str:
        db = get_db()
        if db is not None:
            try:
                doc = incident.model_dump()
                res = await db["incidents"].insert_one(doc)
                return str(res.inserted_id)
            except Exception as e:
                print(f"[MongoDB Warning] Failed to write incident to MongoDB Atlas. Falling back to in-memory storage. Error: {e}")
        
        # In-memory fallback
        mock_id = f"inc_{uuid.uuid4().hex[:12]}"
        in_memory_incidents[mock_id] = incident.model_dump()
        return mock_id

class AlertRepository:
    """
    Asynchronous repository for managing WindOps Alerts in MongoDB,
    with an automatic fallback to in-memory storage if MongoDB is offline.
    """
    async def create(self, alert: Alert) -> str:
        db = get_db()
        if db is not None:
            try:
                doc = alert.model_dump()
                res = await db["alerts"].insert_one(doc)
                return str(res.inserted_id)
            except Exception as e:
                print(f"[MongoDB Warning] Failed to write alert to MongoDB Atlas. Falling back to in-memory storage. Error: {e}")
                
        # In-memory fallback
        mock_id = f"alt_{uuid.uuid4().hex[:12]}"
        in_memory_alerts[mock_id] = alert.model_dump()
        return mock_id

# Instances for easy importing in agents
repo = IncidentRepository()
alert_repo = AlertRepository()
