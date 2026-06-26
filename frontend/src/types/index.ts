export type Severity = "low" | "medium" | "high" | "critical";
export type TurbineStatusValue = "normal" | "warning" | "critical" | "offline";

export interface TurbineStatus {
  turbine_id: string;
  name: string;
  status: TurbineStatusValue;
  /** Health score between 0.0 and 1.0 */
  health_score: number;
  /** ISO datetime */
  last_seen: string;
  active_alert_id?: string;
}

export interface TelemetryPayload {
  turbine_id: string;
  /** ISO datetime */
  timestamp: string;
  /** Wind speed in m/s */
  wind_speed: number;
  rotor_rpm: number;
  /** Power output in kW */
  power_output: number;
  /** Gearbox temperature in °C */
  temperature_gearbox: number;
  /** Generator temperature in °C */
  temperature_generator: number;
  /** Vibration level in mm/s */
  vibration_level: number;
  /** Blade pitch angle in degrees */
  blade_pitch_angle: number;
}

export interface TelemetryResponse {
  correlation_id: string;
  turbine_id: string;
  anomaly_detected: boolean;
  health_score: number;
  severity?: Severity;
  alert_id?: string;
  incident_id?: string;
  agents_triggered: string[];
  duration_ms: number;
}

export interface Alert {
  alert_id: string;
  turbine_id: string;
  severity: Severity;
  message: string;
  created_at: string;
  acknowledged: boolean;
  correlation_id: string;
}

export interface Incident {
  incident_id: string;
  turbine_id: string;
  correlation_id: string;
  created_at: string;
  closed_at?: string;
  severity: Severity;
  status: "open" | "investigating" | "resolved" | "escalated";
  root_cause?: string;
  recommended_action?: string;
  agents_involved: string[];
  report_id?: string;
}

export interface EmailLog {
  email_id: string;
  sent_at: string;
  recipient: string;
  subject: string;
  body?: string;
  turbine_id: string;
  severity: Severity;
  status: "sent" | "simulated" | "failed";
  incident_id?: string;
}

export interface AgentMetric {
  agent_name: string;
  status: "healthy" | "degraded" | "error";
  avg_response_ms: number;
  calls_last_hour: number;
  /** Error rate between 0.0 and 1.0 */
  error_rate: number;
  tokens_used_today: number;
}

export interface DashboardMetrics {
  total_turbines: number;
  turbines_in_alert: number;
  avg_health_score: number;
  incidents_today: number;
  incidents_resolved_today: number;
  pipeline_avg_ms: number;
  agents: AgentMetric[];
  health_score_history: { timestamp: string; avg_score: number }[];
}
