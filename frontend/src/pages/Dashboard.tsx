import { useNavigate } from "react-router-dom";
import { Wind, Activity, AlertTriangle, Bell } from "lucide-react";
import { useTurbines, useMetrics, useAlerts } from "../hooks/useWindOps";
import { formatRelative } from "../lib/date";
import type { TurbineStatus, Alert, AgentMetric } from "../types";
import { Badge } from "../components/ui/Badge";
import { StatCard } from "../components/ui/StatCard";
import { AgentStatusDot } from "../components/ui/AgentStatusDot";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { TurbineCard } from "../components/TurbineCard";

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function AgentRow({ agent }: { agent: AgentMetric }) {
  return (
    <div className="group relative flex items-center gap-4 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3">
      <AgentStatusDot status={agent.status} name={agent.agent_name} />
      <div className="flex flex-1 items-center justify-between text-sm">
        <span className="text-slate-300">
          {agent.avg_response_ms.toFixed(0)} ms
        </span>
        <span className="text-slate-400">
          erreur {formatPercent(agent.error_rate)}
        </span>
      </div>
      <div className="pointer-events-none absolute left-0 top-full z-10 mt-2 hidden rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 shadow-lg group-hover:block">
        <p>Tokens aujourd’hui : {agent.tokens_used_today.toLocaleString()}</p>
        <p>Appels dernière heure : {agent.calls_last_hour}</p>
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  return (
    <tr className="text-slate-300">
      <td className="px-4 py-3">
        <Badge severity={alert.severity}>{alert.severity}</Badge>
      </td>
      <td className="px-4 py-3 font-medium text-slate-200">
        {alert.turbine_id}
      </td>
      <td className="px-4 py-3">{alert.message}</td>
      <td className="px-4 py-3 text-right text-slate-400">
        {formatRelative(alert.created_at)}
      </td>
    </tr>
  );
}

export function Dashboard() {
  const navigate = useNavigate();

  const {
    data: turbines,
    isLoading: turbinesLoading,
    error: turbinesError,
  } = useTurbines();

  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useMetrics();

  const {
    data: alerts,
    isLoading: alertsLoading,
    error: alertsError,
  } = useAlerts();

  const isLoading = turbinesLoading || metricsLoading || alertsLoading;
  const error = turbinesError || metricsError || alertsError;

  const hasActiveAlert = (metrics?.turbines_in_alert ?? 0) > 0;
  const recentAlerts = alerts?.slice(0, 5) ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Barre de titre */}
      <header className="border-b border-slate-700 bg-slate-900 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Wind className="h-7 w-7 text-sky-400" />
            <h1 className="text-2xl font-bold">WindOps Copilot</h1>
          </div>
          <Badge severity={hasActiveAlert ? "critical" : "healthy"}>
            {hasActiveAlert ? "Alerte active" : "Système opérationnel"}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 p-6">
        {error && (
          <div className="rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-200">
            Erreur lors du chargement des données : {error.message}
          </div>
        )}

        {/* Métriques globales */}
        <section>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total éoliennes"
              value={metrics?.total_turbines ?? 0}
              icon={<Wind className="h-4 w-4" />}
            />
            <StatCard
              label="En alerte"
              value={metrics?.turbines_in_alert ?? 0}
              icon={<AlertTriangle className="h-4 w-4" />}
              trend={
                (metrics?.turbines_in_alert ?? 0) > 0 ? "down" : "stable"
              }
            />
            <StatCard
              label="Score santé moyen"
              value={formatPercent(metrics?.avg_health_score ?? 0)}
              icon={<Activity className="h-4 w-4" />}
            />
            <StatCard
              label="Incidents aujourd'hui"
              value={metrics?.incidents_today ?? 0}
              icon={<Bell className="h-4 w-4" />}
            />
          </div>
        </section>

        {/* État des agents */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-100">
            État des agents
          </h2>
          {metrics?.agents && metrics.agents.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {metrics.agents.map((agent) => (
                <AgentRow key={agent.agent_name} agent={agent} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Aucun agent actif.</p>
          )}
        </section>

        {/* Grille des éoliennes */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-100">
            Parc éolien
          </h2>
          {turbines && turbines.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {turbines.map((turbine: TurbineStatus) => (
                <TurbineCard
                  key={turbine.turbine_id}
                  turbine={turbine}
                  onClick={(t) => navigate(`/turbines/${t.turbine_id}`)}
                  onAlertClick={(alertId) => navigate(`/alerts/${alertId}`)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Aucune éolienne disponible.</p>
          )}
        </section>

        {/* Dernières alertes */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">
              Dernières alertes
            </h2>
            <button
              type="button"
              onClick={() => navigate("/alerts")}
              className="text-sm font-medium text-sky-400 hover:text-sky-300"
            >
              Voir toutes les alertes →
            </button>
          </div>

          {recentAlerts.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-slate-700">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-700 text-slate-100">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Sévérité</th>
                    <th className="px-4 py-3 font-semibold">Éolienne</th>
                    <th className="px-4 py-3 font-semibold">Message</th>
                    <th className="px-4 py-3 text-right font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 bg-slate-800">
                  {recentAlerts.map((alert: Alert) => (
                    <AlertRow key={alert.alert_id} alert={alert} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Aucune alerte récente.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
