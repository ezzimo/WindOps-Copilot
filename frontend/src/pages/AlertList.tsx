import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { formatRelative } from "../lib/date";
import { AlertTriangle, Check, X, ArrowRight, Bell } from "lucide-react";
import { useAlerts, useIncidents } from "../hooks/useWindOps";
import type { Alert } from "../types";

// UI Components
import Badge from "../components/ui/Badge";
import Table from "../components/ui/Table";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";

type TabType = "Toutes" | "Non acquittées" | "Critiques";

export function AlertList() {
  const { data: alerts, isLoading, error } = useAlerts();
  const { data: incidents } = useIncidents();

  // Selected Alert for Details Slide-over
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Tabs selection state
  const [activeTab, setActiveTab] = useState<TabType>("Toutes");

  // Compute unacknowledged alerts count for header badge
  const unackCount = useMemo(() => {
    if (!alerts) return 0;
    return alerts.filter((a) => !a.acknowledged).length;
  }, [alerts]);

  // Compute unacknowledged critical alerts count for the red warning banner
  const unackCriticalCount = useMemo(() => {
    if (!alerts) return 0;
    return alerts.filter((a) => !a.acknowledged && a.severity === "critical").length;
  }, [alerts]);

  // Filter alerts according to active tab
  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    return alerts.filter((alert) => {
      if (activeTab === "Non acquittées") return !alert.acknowledged;
      if (activeTab === "Critiques") return alert.severity === "critical";
      return true; // "Toutes"
    });
  }, [alerts, activeTab]);

  // Sort alerts: unacknowledged first, then by date descending
  const sortedAlerts = useMemo(() => {
    return [...filteredAlerts].sort((a, b) => {
      if (a.acknowledged !== b.acknowledged) {
        return a.acknowledged ? 1 : -1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredAlerts]);

  // Look up corresponding incident with the same correlation_id for link redirection
  const relatedIncident = useMemo(() => {
    if (!selectedAlert || !incidents) return null;
    return incidents.find((inc) => inc.correlation_id === selectedAlert.correlation_id);
  }, [selectedAlert, incidents]);

  // Column definitions for Alert list table
  const columns = [
    {
      key: "severity",
      label: "Sévérité",
      render: (value: any) => <Badge severity={value} />,
      width: "110px",
    },
    {
      key: "turbine_id",
      label: "Éolienne",
      width: "120px",
    },
    {
      key: "message",
      label: "Message",
      render: (value: any) => {
        const text = String(value ?? "");
        const truncated = text.length > 80 ? `${text.slice(0, 80)}...` : text;
        return (
          <span title={text} className="cursor-help hover:text-slate-100 transition-colors">
            {truncated}
          </span>
        );
      },
    },
    {
      key: "created_at",
      label: "Date",
      render: (value: any) => {
        const dateStr = String(value ?? "");
        const exactTime = dateStr
          ? (() => {
              try {
                return format(parseISO(dateStr), "dd/MM/yyyy HH:mm:ss");
              } catch {
                return "Date invalide";
              }
            })()
          : "Date inconnue";
        return (
          <span title={exactTime} className="cursor-help font-medium text-slate-400">
            {formatRelative(dateStr)}
          </span>
        );
      },
      width: "180px",
    },
    {
      key: "acknowledged",
      label: "Acquittée",
      render: (value: any) => {
        return value ? (
          <span className="text-emerald-500 flex items-center justify-start pl-4" title="Oui">
            <Check size={16} />
          </span>
        ) : (
          <span className="text-slate-600 pl-4 font-bold">–</span>
        );
      },
      width: "110px",
    },
    {
      key: "correlation_id",
      label: "Corrélation ID",
      render: (value: any) => (
        <span className="font-mono text-xs text-slate-500">
          {String(value ?? "").slice(0, 8)}
        </span>
      ),
      width: "120px",
    },
  ];

  // Callback to style rows (e.g. adding a left colored border for unacknowledged alerts)
  const getRowClassName = (row: Alert) => {
    let classes = "";
    if (!row.acknowledged) {
      const borderMap = {
        critical: "border-l-[4px] border-l-red-500 bg-red-950/5",
        high: "border-l-[4px] border-l-orange-500 bg-orange-950/5",
        medium: "border-l-[4px] border-l-amber-500 bg-amber-950/5",
        low: "border-l-[4px] border-l-emerald-500 bg-emerald-950/5",
      };
      classes = borderMap[row.severity] ?? "border-l-[4px] border-l-slate-500 bg-slate-900/10";
    }
    return classes;
  };

  return (
    <div className="space-y-6 p-6 relative">
      
      {/* Header + Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <span>Alertes</span>
          {unackCount > 0 && (
            <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-lg shadow-red-950/20 animate-pulse">
              {unackCount} non acquittées
            </span>
          )}
        </h1>
      </div>

      {/* Warning Banner for Unacknowledged Critical Alerts */}
      {unackCriticalCount > 0 && (
        <div className="flex items-center gap-3 bg-red-950/40 border border-red-800 p-4 rounded-lg text-red-400 shadow-md">
          <AlertTriangle size={20} className="animate-bounce" />
          <span className="font-semibold text-sm">
            {unackCriticalCount} alerte{unackCriticalCount > 1 ? "s" : ""} critique{unackCriticalCount > 1 ? "s" : ""} non acquittée{unackCriticalCount > 1 ? "s" : ""} requiert votre attention !
          </span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800 gap-1">
        {(["Toutes", "Non acquittées", "Critiques"] as TabType[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 text-sm font-semibold transition-colors border-b-2 -mb-[2px] ${
                isActive
                  ? "border-sky-500 text-sky-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Main Alerts Table Area */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-lg text-center">
          <p className="text-red-400 font-medium">
            Erreur lors de la récupération des alertes.
          </p>
        </div>
      ) : sortedAlerts.length === 0 ? (
        <EmptyState
          message={`Aucune alerte trouvée dans l'onglet "${activeTab}".`}
          icon={<Bell size={32} />}
        />
      ) : (
        <Table<Alert>
          columns={columns}
          data={sortedAlerts}
          onRowClick={(row) => setSelectedAlert(row)}
          rowClassName={getRowClassName}
        />
      )}

      {/* Side Slide-Over Panel for Alert Details */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedAlert(null)}
          />

          {/* Sliding panel contents */}
          <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 shadow-2xl flex flex-col justify-between text-slate-100 z-10 animate-slide-in">
            <div className="space-y-6">
              
              {/* Slide-over header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Bell size={18} className="text-sky-500" />
                  <span>Détail de l'alerte</span>
                </h2>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="rounded-full p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Fermer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Slide-over body data */}
              <div className="space-y-5">
                {/* Alert message block */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Message
                  </label>
                  <p className="text-sm font-medium bg-slate-950/60 border border-slate-850 p-3 rounded-md text-slate-200">
                    {selectedAlert.message}
                  </p>
                </div>

                {/* Info parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Éolienne
                    </label>
                    <Link
                      to={`/turbines/${selectedAlert.turbine_id}`}
                      className="text-sm font-bold text-sky-400 hover:text-sky-300 hover:underline"
                    >
                      {selectedAlert.turbine_id}
                    </Link>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Sévérité
                    </label>
                    <div>
                      <Badge severity={selectedAlert.severity} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Statut d'acquittement
                    </label>
                    <span className="text-sm font-semibold flex items-center gap-1">
                      {selectedAlert.acknowledged ? (
                        <>
                          <Check size={14} className="text-emerald-500" />
                          <span className="text-emerald-400">Acquittée</span>
                        </>
                      ) : (
                        <span className="text-amber-500">Non acquittée</span>
                      )}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Date exacte
                    </label>
                    <span className="text-sm font-medium text-slate-300">
                      {selectedAlert.created_at
                        ? (() => {
                            try {
                              return format(parseISO(selectedAlert.created_at), "dd/MM/yyyy HH:mm:ss");
                            } catch {
                              return "Date invalide";
                            }
                          })()
                        : "Date inconnue"}
                    </span>
                  </div>
                </div>

                {/* Correlation ID block */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Correlation ID
                  </label>
                  <span className="font-mono text-xs text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 inline-block w-full text-center">
                    {selectedAlert.correlation_id}
                  </span>
                </div>

                {/* Link to incident if match found */}
                {relatedIncident && (
                  <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-lg mt-4">
                    <p className="text-xs text-slate-400">
                      Un incident lié à cette alerte est ouvert par le pipeline IA.
                    </p>
                    <Link
                      to={`/incidents/${relatedIncident.incident_id}`}
                      onClick={() => setSelectedAlert(null)}
                      className="text-sm text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1.5 mt-2 hover:underline"
                    >
                      <span>Voir l'incident</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Close Button footer */}
            <div className="border-t border-slate-800 pt-4 mt-6">
              <button
                onClick={() => setSelectedAlert(null)}
                className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-md py-2 text-sm font-semibold transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlertList;
