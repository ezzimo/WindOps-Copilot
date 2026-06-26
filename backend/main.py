import uuid
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bson import ObjectId
from backend.graph.graph import run_pipeline
from backend.database import get_db
from backend.repositories import in_memory_incidents, in_memory_alerts
from backend.services import gmail_service

app = FastAPI(title="WindOps Copilot Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

# Input Payload schema matching prompt
class TelemetryPayload(BaseModel):
    turbine_id: str
    wind_speed: float
    rotor_rpm: float
    power_output: float
    temperature_gearbox: float
    temperature_generator: float
    vibration_level: float
    blade_pitch_angle: float
    timestamp: Optional[str] = None
    correlation_id: Optional[str] = None

# Response Schema matching prompt
class TelemetryResponse(BaseModel):
    correlation_id: str
    turbine_id: str
    anomaly_detected: bool
    health_score: float
    severity: Optional[str] = None
    alert_id: Optional[str] = None
    incident_id: Optional[str] = None
    agents_triggered: List[str] = []
    duration_ms: float

@router.post("/api/telemetry", response_model=TelemetryResponse)
async def receive_telemetry(payload: TelemetryPayload):
    """
    Receives wind turbine sensor data, runs the LangGraph pipeline,
    computes execution time, and returns the analysis outcome.
    """
    start_time = time.time()
    
    # 1. Initialize correlation ID and timestamp if missing
    if not payload.correlation_id:
        payload.correlation_id = str(uuid.uuid4())
    if not payload.timestamp:
        payload.timestamp = datetime.utcnow().isoformat()
        
    # Map payload properties to the schema expected by the LangGraph pipeline
    payload_dict = {
        "correlation_id": payload.correlation_id,
        "turbine_id": payload.turbine_id,
        "sensor_data": {
            "wind_speed": payload.wind_speed,
            "rotor_rpm": payload.rotor_rpm,
            "power_output": payload.power_output,
            "temperature_gearbox": payload.temperature_gearbox,
            "temperature_generator": payload.temperature_generator,
            "vibration_level": payload.vibration_level,
            "blade_pitch_angle": payload.blade_pitch_angle,
            "timestamp": payload.timestamp
        }
    }
    
    # 2. Invoke the compiled LangGraph pipeline
    final_state = await run_pipeline(payload_dict)
    
    # 3. Compute duration (prefer pipeline-reported duration when available)
    duration_ms = final_state.get("duration_ms") or (time.time() - start_time) * 1000

    # 4. Return the formatted response
    return TelemetryResponse(
        correlation_id=payload.correlation_id,
        turbine_id=payload.turbine_id,
        anomaly_detected=final_state.get("anomaly_detected", False),
        health_score=final_state.get("health_score", 1.0),
        severity=final_state.get("severity"),
        alert_id=final_state.get("alert_id"),
        incident_id=final_state.get("incident_id"),
        agents_triggered=final_state.get("agents_triggered", []),
        duration_ms=duration_ms
    )

@router.get("/api/turbines")
async def get_turbines():
    """
    Lists the supervised wind turbines from MongoDB.
    """
    db = get_db()
    if db is not None:
        try:
            cursor = db["turbines"].find()
            turbines = await cursor.to_list(length=100)
            for t in turbines:
                t["_id"] = str(t["_id"])
            return turbines
        except Exception as e:
            print(f"[MongoDB Get Warning] Failed to query turbines collection: {e}")

    return []

@router.get("/api/alerts")
async def get_alerts():
    """
    Lists the logged alerts. Pulls from MongoDB or in-memory fallback.
    """
    db = get_db()
    if db is not None:
        try:
            cursor = db["alerts"].find()
            alerts = await cursor.to_list(length=100)
            for a in alerts:
                a["_id"] = str(a["_id"])
            return alerts
        except Exception as e:
            print(f"[MongoDB Get Warning] Failed to query alerts collection: {e}")
            
    return list(in_memory_alerts.values())

@router.get("/api/incidents")
async def get_incidents():
    """
    Lists the logged incidents. Pulls from MongoDB or in-memory fallback.
    """
    db = get_db()
    if db is not None:
        try:
            cursor = db["incidents"].find()
            incidents = await cursor.to_list(length=100)
            for i in incidents:
                i["_id"] = str(i["_id"])
            return incidents
        except Exception as e:
            print(f"[MongoDB Get Warning] Failed to query incidents collection: {e}")
            
    return list(in_memory_incidents.values())


@router.get("/api/incidents/{incident_id}")
async def get_incident(incident_id: str):
    """
    Retrieves a single incident by its incident_id or MongoDB _id.
    """
    db = get_db()
    if db is not None:
        try:
            incident = None
            # Try lookup by incident_id first
            doc = await db["incidents"].find_one({"incident_id": incident_id})
            if doc:
                incident = doc
            # Fallback to MongoDB ObjectId
            elif ObjectId.is_valid(incident_id):
                doc = await db["incidents"].find_one({"_id": ObjectId(incident_id)})
                if doc:
                    incident = doc

            if incident:
                incident["_id"] = str(incident["_id"])
                return incident
        except Exception as e:
            print(f"[MongoDB Get Warning] Failed to query incident {incident_id}: {e}")

    # In-memory fallback
    for inc in in_memory_incidents.values():
        if inc.get("incident_id") == incident_id or str(inc.get("_id", "")) == incident_id:
            return inc

    raise HTTPException(status_code=404, detail="Incident non trouvé")


@router.get("/api/reports/{report_id}")
async def get_report(report_id: str):
    """
    Downloads a generated PDF report by its ID.
    """
    pdf_path = Path("/tmp/reports") / f"{report_id}.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Rapport non disponible")

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=f"rapport-{report_id}.pdf",
    )


@router.get("/api/emails")
async def get_emails():
    """
    Returns the list of emails logged by GmailService.
    """
    return list(gmail_service.email_log)


def _agent_status_from_error_rate(error_rate: float) -> str:
    """Determine agent health status based on its recent error rate."""
    if error_rate < 0.2:
        return "healthy"
    if error_rate < 0.5:
        return "degraded"
    return "error"


async def _compute_agent_metrics(db) -> list[dict]:
    """
    Compute per-agent metrics from MongoDB incident/agent trace data.
    """
    agent_names = ["supervisor", "monitoring", "diagnosis", "decision", "notification"]
    metrics = []

    if db is None:
        for agent in agent_names:
            metrics.append(
                {
                    "agent_name": agent,
                    "status": "healthy",
                    "avg_response_ms": 0,
                    "calls_last_hour": 0,
                    "error_rate": 0.0,
                    "tokens_used_today": 0,
                }
            )
        return metrics

    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)

    try:
        last20_cursor = db["incidents"].find({}).sort("created_at", -1).limit(20)
        last20 = await last20_cursor.to_list(length=20)
    except Exception as e:
        print(f"[Metrics Warning] Failed to fetch incidents for agent metrics: {e}")
        last20 = []

    for agent in agent_names:
        try:
            calls_last_hour = await db["incidents"].count_documents(
                {"created_at": {"$gte": one_hour_ago.isoformat()}, "agents_involved": agent}
            )
        except Exception as e:
            print(f"[Metrics Warning] Failed to count calls for {agent}: {e}")
            calls_last_hour = 0

        agent_incidents = [
            inc for inc in last20 if agent in inc.get("agents_involved", [])
        ]
        total = len(agent_incidents)

        avg_response_ms = 0.0
        error_rate = 0.0

        if total:
            per_agent_durations = []
            for inc in agent_incidents:
                duration = inc.get("duration_ms")
                n_agents = len(inc.get("agents_involved", []))
                if duration and n_agents:
                    per_agent_durations.append(duration / n_agents)

            if per_agent_durations:
                avg_response_ms = round(
                    sum(per_agent_durations) / len(per_agent_durations), 2
                )

            failed = 0
            for inc in agent_incidents:
                trace = inc.get("agent_trace", []) or []
                if any(
                    entry.get("agent") == agent and entry.get("status") == "failed"
                    for entry in trace
                ):
                    failed += 1

            error_rate = round(failed / total, 4)

        metrics.append(
            {
                "agent_name": agent,
                "status": _agent_status_from_error_rate(error_rate),
                "avg_response_ms": avg_response_ms,
                "calls_last_hour": calls_last_hour,
                "error_rate": error_rate,
                "tokens_used_today": 0,
            }
        )

    return metrics


@router.get("/api/metrics")
async def get_metrics():
    """
    Computes and returns real-time dashboard metrics.
    """
    db = get_db()
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    total_turbines = 0
    turbines_in_alert = 0
    avg_health_score = 1.0
    incidents_today = 0
    incidents_resolved_today = 0
    pipeline_avg_ms = 0.0

    if db is not None:
        try:
            total_turbines = await db["turbines"].count_documents({})
        except Exception as e:
            print(f"[Metrics Warning] Failed to count turbines: {e}")

        try:
            turbines_in_alert = await db["alerts"].count_documents(
                {"acknowledged": {"$ne": True}}
            )
        except Exception as e:
            print(f"[Metrics Warning] Failed to count active alerts: {e}")

        try:
            health_cursor = db["turbines"].aggregate(
                [{"$group": {"_id": None, "avg": {"$avg": "$health_score"}}}]
            )
            health_result = await health_cursor.to_list(length=1)
            if health_result and health_result[0].get("avg") is not None:
                avg_health_score = float(health_result[0]["avg"])
        except Exception as e:
            print(f"[Metrics Warning] Failed to compute avg health score: {e}")

        try:
            incidents_today = await db["incidents"].count_documents(
                {"created_at": {"$gte": today.isoformat()}}
            )
        except Exception as e:
            print(f"[Metrics Warning] Failed to count incidents today: {e}")

        try:
            incidents_resolved_today = await db["incidents"].count_documents(
                {
                    "status": "resolved",
                    "closed_at": {"$gte": today.isoformat()},
                }
            )
        except Exception as e:
            print(f"[Metrics Warning] Failed to count resolved incidents today: {e}")

        try:
            pipeline_cursor = db["incidents"].aggregate(
                [
                    {"$sort": {"created_at": -1}},
                    {"$limit": 20},
                    {"$group": {"_id": None, "avg": {"$avg": "$duration_ms"}}},
                ]
            )
            pipeline_result = await pipeline_cursor.to_list(length=1)
            if pipeline_result and pipeline_result[0].get("avg") is not None:
                pipeline_avg_ms = float(pipeline_result[0]["avg"])
        except Exception as e:
            print(f"[Metrics Warning] Failed to compute pipeline avg duration: {e}")

    agents = await _compute_agent_metrics(db)

    return {
        "total_turbines": total_turbines,
        "turbines_in_alert": turbines_in_alert,
        "avg_health_score": avg_health_score,
        "incidents_today": incidents_today,
        "incidents_resolved_today": incidents_resolved_today,
        "pipeline_avg_ms": pipeline_avg_ms,
        "agents": agents,
        "health_score_history": [],
    }


app.include_router(router)
