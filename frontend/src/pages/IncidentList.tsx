import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Download, AlertTriangle, RefreshCw } from "lucide-react";
import { useIncidents } from "../hooks/useWindOps";
import { downloadReport } from "../api/reports";
import type { Incident } from "../types";

// UI Components
import Badge from "../components/ui/Badge";
import Table from "../components/ui/Table";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";

export function IncidentList() {
  const navigate = useNavigate();
  const { data: incidents, isLoading, error } = useIncidents();

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>("Tous");
  const [severityFilter, setSeverityFilter] = useState<string>("Tous");
  const [turbineFilter, setTurbineFilter] = useState<string>("");

  // Client-side filtering logic
  const filteredIncidents = useMemo(() => {
    if (!incidents) return [];
    return incidents.filter((incident) => {
      const matchStatus =
        statusFilter === "Tous" || incident.status === statusFilter;
      const matchSeverity =
        severityFilter === "Tous" || incident.severity === severityFilter;
      const matchTurbine =
        !turbineFilter ||
        incident.turbine_id
          .toLowerCase()
          .includes(turbineFilter.toLowerCase());
      return matchStatus && matchSeverity && matchTurbine;
    });
  }, [incidents, statusFilter, severityFilter, turbineFilter]);

  const handleReset = () => {
    setStatusFilter("Tous");
    setSeverityFilter("Tous");
    setTurbineFilter("");
  };

  // Columns definition for UI Table
  const columns = [
    {
      key: "severity",
      label: "Sévérité",
      render: (value: any) => <Badge severity={value} />,
      width: "110px",
    },
    {
      key: "incident_id",
      label: "Incident ID",
      render: (value: any) => (
        <span className="font-mono text-xs text-slate-400">
          {String(value).slice(0, 12)}
        </span>
      ),
      width: "120px",
    },
    {
      key: "turbine_id",
      label: "Éolienne",
      width: "120px",
    },
    {
      key: "root_cause",
      label: "Cause",
      render: (value: any) => {
        const text = value ? String(value) : "N/A";
        return text.length > 60 ? `${text.slice(0, 60)}...` : text;
      },
    },
    {
      key: "recommended_action",
      label: "Action",
      render: (value: any) => {
        const text = value ? String(value) : "N/A";
        return text.length > 60 ? `${text.slice(0, 60)}...` : text;
      },
    },
    {
      key: "created_at",
      label: "Date création",
      render: (value: any) => {
        try {
          return format(parseISO(String(value)), "dd/MM/yyyy HH:mm");
        } catch {
          return String(value);
        }
      },
      width: "150px",
    },
    {
      key: "status",
      label: "Statut",
      render: (value: any) => {
        const statusSeverityMap: Record<
          string,
          "critical" | "high" | "medium" | "low" | "normal" | "healthy" | "degraded"
        > = {
          open: "high",
          investigating: "medium",
          resolved: "healthy",
          escalated: "critical",
        };
        return (
          <Badge severity={statusSeverityMap[value] ?? "normal"}>
            {value}
          </Badge>
        );
      },
      width: "120px",
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: Incident) => {
        if (!row.report_id) return null;
        return (
          <button
            onClick={async (e) => {
              e.stopPropagation(); // Avoid triggering navigation row click
              try {
                await downloadReport(row.report_id!);
              } catch (err) {
                console.error("Failed to download report", err);
              }
            }}
            className="rounded p-1 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition-colors flex items-center justify-center"
            title="Télécharger le rapport PDF"
          >
            <Download size={16} />
          </button>
        );
      },
      width: "80px",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Title + Count */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <span>Incidents</span>
          <span className="text-sm font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            ({incidents?.length ?? 0})
          </span>
        </h1>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-800/40 rounded-lg border border-slate-700">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Statut
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-md py-1.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
          >
            <option value="Tous">Tous</option>
            <option value="open">open</option>
            <option value="investigating">investigating</option>
            <option value="resolved">resolved</option>
            <option value="escalated">escalated</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Sévérité
          </label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-md py-1.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
          >
            <option value="Tous">Tous</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Éolienne
          </label>
          <input
            type="text"
            placeholder="Filtrer par éolienne..."
            value={turbineFilter}
            onChange={(e) => setTurbineFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-md py-1.5 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={handleReset}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-200 hover:text-slate-100 border border-slate-600 rounded-md py-1.5 px-4 text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} />
            <span>Réinitialiser les filtres</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-lg text-center">
          <p className="text-red-400 font-medium">
            Erreur lors de la récupération des incidents.
          </p>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <EmptyState
          message="Aucun incident ne correspond aux critères de recherche."
          icon={<AlertTriangle size={32} />}
        />
      ) : (
        <Table<Incident>
          columns={columns}
          data={filteredIncidents}
          onRowClick={(row) => navigate(`/incidents/${row.incident_id}`)}
        />
      )}
    </div>
  );
}

export default IncidentList;
