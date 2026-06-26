import { apiClient } from "./client";
import type { DashboardMetrics } from "../types";

export async function fetchMetrics(): Promise<DashboardMetrics> {
  const response = await apiClient.get<DashboardMetrics>("/api/metrics");
  return response.data;
}
