import { apiClient } from "./client";
import type { Alert, Severity } from "../types";

export interface AlertFilters {
  turbine_id?: string;
  severity?: Severity;
  acknowledged?: boolean;
}

export async function fetchAlerts(filters?: AlertFilters): Promise<Alert[]> {
  const response = await apiClient.get<Alert[]>("/api/alerts", {
    params: filters,
  });
  return response.data;
}
