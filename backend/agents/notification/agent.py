import time

from backend.graph.state import WindOpsState
from backend.repositories import Incident, Alert, repo, alert_repo
from backend.services import report_service, gmail_service


def build_alert_email_html(state: dict) -> str:
    """
    Builds a simple 2-column HTML email template for wind turbine alerts.
    The title color is dynamically set based on the alert severity.
    """
    severity = state.get("severity", "low").upper()
    turbine_id = state.get("turbine_id", "unknown")
    root_cause = state.get("root_cause", "Anomalie détectée")
    recommended_action = state.get("recommended_action", "N/A")
    correlation_id = state.get("correlation_id", "N/A")

    # Choose header color based on severity
    title_color = "#e28743"  # Default orange (warning)
    if severity == "CRITICAL":
        title_color = "#d9534f"  # Red
    elif severity == "HIGH":
        title_color = "#f0ad4e"  # Amber
    elif severity == "MEDIUM":
        title_color = "#0275d8"  # Blue
    elif severity == "LOW":
        title_color = "#5cb85c"  # Green

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 20px;">
        <h2 style="color: {title_color}; border-bottom: 2px solid {title_color}; padding-bottom: 5px; margin-top: 0;">
            Alerte WindOps Copilot — {severity}
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background-color: #f9f9f9;">
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Turbine ID</td>
                <td style="padding: 10px; border: 1px solid #ddd;">{turbine_id}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Sévérité</td>
                <td style="padding: 10px; border: 1px solid #ddd; color: {title_color}; font-weight: bold;">{severity}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Cause Racine</td>
                <td style="padding: 10px; border: 1px solid #ddd;">{root_cause}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Action Recommandée</td>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">{recommended_action}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Correlation ID</td>
                <td style="padding: 10px; border: 1px solid #ddd; font-size: 0.9em; font-family: monospace;">{correlation_id}</td>
            </tr>
        </table>
        <br>
        <footer style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; font-size: 0.85em; color: #777; font-style: italic;">
            Décision finale à la charge de l'opérateur humain.
        </footer>
    </body>
    </html>
    """
    return html


async def notification_node(state: WindOpsState) -> dict:
    """
    Notification Agent node function.
    Handles incident creation in MongoDB, report PDF generation, email dispatch, and alert logging.
    """
    turbine_id = state.get("turbine_id", "unknown")
    correlation_id = state.get("correlation_id", "unknown")
    severity = state.get("severity", "low")

    try:
        # 1. CRÉER L'INCIDENT en MongoDB via IncidentRepository
        pipeline_start = state.get("pipeline_start_time")
        duration_ms = (
            round((time.time() - pipeline_start) * 1000, 2)
            if pipeline_start
            else None
        )

        incident = Incident(
            turbine_id=turbine_id,
            correlation_id=correlation_id,
            severity=severity,
            status="open",
            root_cause=state.get("root_cause"),
            recommended_action=state.get("recommended_action"),
            agents_involved=state.get("agents_triggered", []) + ["notification"],
            report_id=correlation_id,
            duration_ms=duration_ms,
            agent_trace=state.get("agent_trace", []),
        )
        incident_id = await repo.create(incident)

        # 2. GÉNÉRER LE RAPPORT PDF via ReportService
        pdf_path = report_service.generate(state)
        report_id = correlation_id

        # 3. ENVOYER L'EMAIL via GmailService
        subject = f"[WindOps] Alerte {severity.upper()} — {turbine_id}"
        body = build_alert_email_html(state)
        sent = await gmail_service.send_alert(
            subject=subject,
            body=body,
            attachment=pdf_path,
            recipient="ops@windops.local",
            turbine_id=turbine_id,
            severity=severity,
            status="sent",
            incident_id=incident_id,
        )

        # 4. CRÉER L'ALERTE en MongoDB via AlertRepository
        message_content = f"{state.get('root_cause', 'Anomalie détectée')} — {state.get('recommended_action', '')}"
        alert = Alert(
            turbine_id=turbine_id,
            severity=severity,
            message=message_content,
            correlation_id=correlation_id,
        )
        alert_id = await alert_repo.create(alert)

        print(f"[Notification] Dispatched alerts. IncidentID={incident_id} AlertID={alert_id}")

        # 5. Build trace entry
        trace_entry = {
            "agent": "notification",
            "status": "success",
            "message": f"Notifications sent successfully. Incident ID: {incident_id}. Alert ID: {alert_id}."
        }

        return {
            "notification_sent": sent,
            "incident_id": incident_id,
            "alert_id": alert_id,
            "report_id": report_id,
            "duration_ms": duration_ms,
            "agents_triggered": ["notification"],
            "agent_trace": [trace_entry]
        }

    except Exception as e:
        error_msg = f"Exception in notification agent for turbine {turbine_id}: {str(e)}"
        print(f"[Notification Error] {error_msg}")

        trace_entry = {
            "agent": "notification",
            "status": "failed",
            "message": f"Notification dispatch failed: {str(e)}"
        }

        return {
            "notification_sent": False,
            "incident_id": None,
            "alert_id": None,
            "report_id": None,
            "agents_triggered": ["notification"],
            "agent_trace": [trace_entry],
            "error_messages": [error_msg]
        }


# Set alias to match graph imports
notification = notification_node
