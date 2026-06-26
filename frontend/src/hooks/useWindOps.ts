import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTurbines, sendTelemetry } from "../api/turbines";
import { fetchAlerts, type AlertFilters } from "../api/alerts";
import { fetchIncidents, type IncidentFilters } from "../api/incidents";
import { fetchEmails } from "../api/emails";
import { fetchMetrics } from "../api/metrics";
import type { TelemetryPayload } from "../types";

const TEN_SECONDS = 10_000;
const FIFTEEN_SECONDS = 15_000;

export function useTurbines() {
  return useQuery({
    queryKey: ["turbines"],
    queryFn: fetchTurbines,
    refetchInterval: TEN_SECONDS,
  });
}

export function useAlerts(filters?: AlertFilters) {
  return useQuery({
    queryKey: ["alerts", filters],
    queryFn: () => fetchAlerts(filters),
  });
}

export function useIncidents(filters?: IncidentFilters) {
  return useQuery({
    queryKey: ["incidents", filters],
    queryFn: () => fetchIncidents(filters),
  });
}

export function useEmails() {
  return useQuery({
    queryKey: ["emails"],
    queryFn: fetchEmails,
  });
}

export function useMetrics() {
  return useQuery({
    queryKey: ["metrics"],
    queryFn: fetchMetrics,
    refetchInterval: FIFTEEN_SECONDS,
  });
}

export function useSendTelemetry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TelemetryPayload) => sendTelemetry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turbines"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
