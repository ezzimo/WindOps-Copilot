import asyncio
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

# Rendre le package backend importable quand on lance le script directement
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import get_db


async def seed():
    db = get_db()
    if db is None:
        print("[Seed Error] Impossible de se connecter à MongoDB.")
        return

    now = datetime.now(timezone.utc)

    # ── Turbines ─────────────────────────────────────────────────────────────
    turbines = [
        {
            "turbine_id": "T-001",
            "name": "Éolienne Nord-1",
            "status": "normal",
            "health_score": 0.92,
            "location": "Zone Nord",
            "last_seen": now.isoformat(),
        },
        {
            "turbine_id": "T-002",
            "name": "Éolienne Nord-2",
            "status": "warning",
            "health_score": 0.61,
            "location": "Zone Nord",
            "last_seen": (now - timedelta(minutes=2)).isoformat(),
        },
        {
            "turbine_id": "T-003",
            "name": "Éolienne Sud-1",
            "status": "critical",
            "health_score": 0.28,
            "location": "Zone Sud",
            "last_seen": (now - timedelta(minutes=5)).isoformat(),
        },
        {
            "turbine_id": "T-004",
            "name": "Éolienne Sud-2",
            "status": "normal",
            "health_score": 0.88,
            "location": "Zone Sud",
            "last_seen": now.isoformat(),
        },
        {
            "turbine_id": "T-005",
            "name": "Éolienne Est-1",
            "status": "offline",
            "health_score": 0.0,
            "location": "Zone Est",
            "last_seen": (now - timedelta(hours=2)).isoformat(),
        },
    ]

    # ── Alerts ───────────────────────────────────────────────────────────────
    alerts = [
        {
            "alert_id": str(uuid.uuid4()),
            "turbine_id": "T-003",
            "severity": "critical",
            "message": "Température boîte de vitesses critique (>90°C)",
            "created_at": (now - timedelta(minutes=5)).isoformat(),
            "acknowledged": False,
            "correlation_id": str(uuid.uuid4()),
        },
        {
            "alert_id": str(uuid.uuid4()),
            "turbine_id": "T-002",
            "severity": "high",
            "message": "Vibration anormale détectée sur le rotor",
            "created_at": (now - timedelta(minutes=15)).isoformat(),
            "acknowledged": False,
            "correlation_id": str(uuid.uuid4()),
        },
        {
            "alert_id": str(uuid.uuid4()),
            "turbine_id": "T-001",
            "severity": "medium",
            "message": "Légère baisse de rendement électrique",
            "created_at": (now - timedelta(hours=1)).isoformat(),
            "acknowledged": True,
            "correlation_id": str(uuid.uuid4()),
        },
        {
            "alert_id": str(uuid.uuid4()),
            "turbine_id": "T-004",
            "severity": "low",
            "message": "Mise à jour de statut opérationnel requise",
            "created_at": (now - timedelta(hours=2)).isoformat(),
            "acknowledged": True,
            "correlation_id": str(uuid.uuid4()),
        },
    ]

    # ── Incidents ────────────────────────────────────────────────────────────
    incidents = [
        {
            "incident_id": str(uuid.uuid4()),
            "turbine_id": "T-003",
            "correlation_id": str(uuid.uuid4()),
            "created_at": (now - timedelta(minutes=10)).isoformat(),
            "severity": "critical",
            "status": "open",
            "root_cause": "Usure des engrenages de la boîte de vitesses",
            "recommended_action": "Arrêt préventif pour inspection",
            "agents_involved": [
                "supervisor",
                "monitoring",
                "diagnosis",
                "decision",
                "notification",
            ],
            "health_score": 0.28,
            "duration_ms": 3240,
        },
        {
            "incident_id": str(uuid.uuid4()),
            "turbine_id": "T-002",
            "correlation_id": str(uuid.uuid4()),
            "created_at": (now - timedelta(hours=1)).isoformat(),
            "severity": "high",
            "status": "investigating",
            "root_cause": "Déséquilibre des pales",
            "recommended_action": "Inspection préventive dans 48h",
            "agents_involved": [
                "supervisor",
                "monitoring",
                "diagnosis",
                "decision",
            ],
            "health_score": 0.61,
            "duration_ms": 2890,
        },
        {
            "incident_id": str(uuid.uuid4()),
            "turbine_id": "T-001",
            "correlation_id": str(uuid.uuid4()),
            "created_at": (now - timedelta(hours=3)).isoformat(),
            "closed_at": (now - timedelta(hours=2)).isoformat(),
            "severity": "medium",
            "status": "resolved",
            "root_cause": "Défaut temporaire convertisseur de fréquence",
            "recommended_action": "Surveillance renforcée",
            "agents_involved": [
                "supervisor",
                "monitoring",
                "diagnosis",
                "decision",
            ],
            "health_score": 0.78,
            "duration_ms": 2100,
        },
    ]

    # ── Reset & insert ───────────────────────────────────────────────────────
    await db["turbines"].delete_many({})
    await db["alerts"].delete_many({})
    await db["incidents"].delete_many({})

    await db["turbines"].insert_many(turbines)
    await db["alerts"].insert_many(alerts)
    await db["incidents"].insert_many(incidents)

    print(
        f"Seed terminé : {len(turbines)} turbines, "
        f"{len(alerts)} alertes, {len(incidents)} incidents"
    )

    # Fermeture propre du client
    client = db.client
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
