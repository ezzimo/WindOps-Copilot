import { apiClient } from "./client";
import type { Incident } from "../types";

export interface IncidentFilters {
  turbine_id?: string;
  status?: string;
}

export async function fetchIncidents(filters?: IncidentFilters): Promise<Incident[]> {
  const response = await apiClient.get<Incident[]>("/api/incidents", {
    params: filters,
  });
  return response.data;
}

export async function fetchIncident(id: string): Promise<Incident> {
  const response = await apiClient.get<Incident>(`/api/incidents/${id}`);
  return response.data;
}
