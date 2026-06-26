import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { 
  ArrowLeft, 
  Download, 
  Mail, 
  Clock, 
  Bot, 
  Compass, 
  AlertCircle 
} from "lucide-react";
import { fetchIncident } from "../api/incidents";
import { downloadReport } from "../api/reports";

// UI Components
import Badge from "../components/ui/Badge";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Query details of incident using react-query
  const { data: incident, isLoading, error } = useQuery({
    queryKey: ["incident", id],
    queryFn: () => fetchIncident(id || ""),
    enabled: !!id,
  });

  // Loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error boundary response
  if (error || !incident) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-lg text-center">
          <p className="text-red-400 font-medium">
            Impossible de charger les détails de l'incident. Il se peut qu'il n'existe pas.
          </p>
          <button
            onClick={() => navigate("/incidents")}
            className="mt-4 inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-200"
          >
            <ArrowLeft size={16} />
            <span>Retour aux incidents</span>
          </button>
        </div>
      </div>
    );
  }

  // Calculate resolution duration if closed_at is set
  let resolutionTime = "";
  if (incident.closed_at) {
    try {
      const created = parseISO(incident.created_at);
      const closed = parseISO(incident.closed_at);
      const diffMs = closed.getTime() - created.getTime();
      const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
      resolutionTime = `Résolu en ${diffHours}h`;
    } catch {
      resolutionTime = "Résolu";
    }
  }

  // Format created_at date
  let formattedDate = "";
  try {
    formattedDate = format(parseISO(incident.created_at), "dd/MM/yyyy HH:mm");
  } catch {
    formattedDate = incident.created_at;
  }

  // Severity state maps
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
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-slate-200">
      
      {/* 1. Breadcrumb navigation */}
      <nav className="text-sm text-slate-400 font-medium flex items-center gap-2">
        <Link to="/incidents" className="hover:text-sky-400 transition-colors">
          Incidents
        </Link>
        <span className="text-slate-600">→</span>
        <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-xs text-slate-300">
          {incident.incident_id}
        </span>
      </nav>

      {/* 2. Header panel */}
      <header className="bg-slate-800/40 border border-slate-700 p-6 rounded-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-mono text-slate-100">
              {incident.incident_id}
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Compass size={14} className="text-slate-500" />
              <span>Turbine concernée :</span>
              <Link 
                to={`/turbines/${incident.turbine_id}`} 
                className="font-semibold text-sky-400 hover:text-sky-300 hover:underline"
              >
                {incident.turbine_id}
              </Link>
            </div>
          </div>
          
          {/* Badges */}
          <div className="flex items-center gap-2">
            <Badge severity={incident.severity}>Sévérité : {incident.severity}</Badge>
            <Badge severity={statusSeverityMap[incident.status] ?? "normal"}>
              Statut : {incident.status}
            </Badge>
          </div>
        </div>

        {/* Timestamps */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 border-t border-slate-700/60 pt-4">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-slate-500" />
            <span>Créé le : {formattedDate}</span>
          </div>
          {resolutionTime && (
            <div className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
              <span>{resolutionTime}</span>
            </div>
          )}
        </div>
      </header>

      {/* 3. Two columns content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column — Diagnostic */}
        <section className="md:col-span-2 bg-slate-800/40 border border-slate-700 rounded-lg p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-100 border-b border-slate-700 pb-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-sky-500" />
            <span>Diagnostic d'Anomalie</span>
          </h2>
          
          <div className="space-y-4">
            {/* Cause racine */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Cause Racine
              </h3>
              <p className="text-slate-100 bg-slate-900/60 border border-slate-800 p-3 rounded-md text-sm font-medium">
                {incident.root_cause || "En cours d'analyse..."}
              </p>
            </div>

            {/* Action recommandée */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Action Recommandée
              </h3>
              <p className="text-slate-100 bg-slate-900/60 border border-slate-800 p-3 rounded-md text-sm font-medium">
                {incident.recommended_action || "Aucune recommandation disponible."}
              </p>
            </div>

            {/* Agents impliqués */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Agents impliqués dans l'analyse
              </h3>
              <div className="flex flex-wrap gap-2">
                {incident.agents_involved && incident.agents_involved.length > 0 ? (
                  incident.agents_involved.map((agentName) => (
                    <div 
                      key={agentName}
                      className="bg-slate-900 border border-slate-700/80 px-2.5 py-1 text-xs text-slate-300 font-mono rounded flex items-center gap-1.5"
                    >
                      <Bot size={12} className="text-sky-500" />
                      <span>{agentName}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Aucun agent répertorié.</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Right Column — Actions */}
        <section className="bg-slate-800/40 border border-slate-700 rounded-lg p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100 border-b border-slate-700 pb-3">
              Actions disponibles
            </h2>

            {/* Télécharger PDF */}
            <div className="relative group">
              <button
                onClick={async () => {
                  if (incident.report_id) {
                    try {
                      await downloadReport(incident.report_id);
                    } catch (err) {
                      console.error("Failed to download report", err);
                    }
                  }
                }}
                disabled={!incident.report_id}
                className={`w-full flex items-center justify-center gap-2 border rounded-md py-2.5 px-4 text-sm font-semibold transition-all ${
                  incident.report_id
                    ? "bg-sky-600 hover:bg-sky-500 text-white border-sky-600 shadow-lg shadow-sky-950/20 active:bg-sky-700"
                    : "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                }`}
                title={!incident.report_id ? "Rapport non disponible" : "Télécharger le PDF"}
              >
                <Download size={16} />
                <span>Télécharger le rapport PDF</span>
              </button>
              
              {/* Custom tooltip if report_id is absent */}
              {!incident.report_id && (
                <div className="absolute left-1/2 -translate-x-1/2 -top-10 scale-0 group-hover:scale-100 bg-slate-950 text-slate-300 border border-slate-800 text-xs px-2.5 py-1 rounded shadow-md pointer-events-none transition-all duration-200 whitespace-nowrap z-10">
                  Rapport non disponible
                </div>
              )}
            </div>

            {/* Voir l'email */}
            <button
              onClick={() => navigate(`/emails?incident_id=${incident.incident_id}`)}
              className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-200 hover:text-slate-100 border border-slate-600 rounded-md py-2.5 px-4 text-sm font-semibold transition-colors"
            >
              <Mail size={16} />
              <span>Voir l'email envoyé</span>
            </button>
          </div>

          {/* Back button */}
          <button
            onClick={() => navigate("/incidents")}
            className="w-full mt-6 md:mt-0 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 active:bg-black text-slate-400 hover:text-slate-300 border border-slate-700 rounded-md py-2 px-4 text-sm font-medium transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Retour aux incidents</span>
          </button>
        </section>
      </div>

      {/* 4. Bottom correlation ID */}
      <footer className="text-center pt-8 border-t border-slate-800/40">
        <p className="font-mono text-[10px] text-slate-600 uppercase tracking-widest">
          Correlation ID : {incident.correlation_id}
        </p>
      </footer>
    </div>
  );
}

export default IncidentDetail;
