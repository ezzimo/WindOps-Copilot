import { apiClient } from "./client";
import type { TurbineStatus, TelemetryPayload, TelemetryResponse } from "../types";

export async function fetchTurbines(): Promise<TurbineStatus[]> {
  const response = await apiClient.get<TurbineStatus[]>("/api/turbines");
  return response.data;
}

export async function sendTelemetry(
  payload: TelemetryPayload
): Promise<TelemetryResponse> {
  const response = await apiClient.post<TelemetryResponse>(
    "/api/telemetry",
    payload,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return response.data;
}
