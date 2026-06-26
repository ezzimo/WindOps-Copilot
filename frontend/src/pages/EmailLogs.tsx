import { useState, useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Mail, X, ArrowRight } from "lucide-react";
import { useEmails } from "../hooks/useWindOps";
import type { EmailLog } from "../types";

// UI Components
import Badge from "../components/ui/Badge";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";

type StatusTabType = "Tous" | "Envoyés" | "Simulés" | "Échecs";

export function EmailLogs() {
  const navigate = useNavigate();
  const { data: emails, isLoading, error } = useEmails();

  // Read incident_id from URL query params
  const [searchParams] = useSearchParams();
  const incidentIdParam = searchParams.get("incident_id");

  // Tab filtering state
  const [activeTab, setActiveTab] = useState<StatusTabType>("Tous");

  // Selected email for detail slide-over
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);

  // Client side filtering logic
  const filteredEmails = useMemo(() => {
    if (!emails) return [];
    return emails.filter((email) => {
      // 1. Filter by incident_id param if present in URL
      if (incidentIdParam && email.incident_id !== incidentIdParam) {
        return false;
      }

      // 2. Filter by selected status tab
      if (activeTab === "Envoyés") return email.status === "sent";
      if (activeTab === "Simulés") return email.status === "simulated";
      if (activeTab === "Échecs") return email.status === "failed";

      return true; // "Tous"
    });
  }, [emails, activeTab, incidentIdParam]);

  // Map status string to severity type for badge
  const getStatusSeverity = (
    status: string
  ): "normal" | "healthy" | "degraded" | "critical" | "medium" => {
    if (status === "sent") return "healthy";
    if (status === "simulated") return "medium"; // Renders amber
    return "critical"; // failed -> red
  };

  const getStatusLabel = (status: string) => {
    if (status === "sent") return "Envoyé";
    if (status === "simulated") return "Simulé";
    return "Échec";
  };

  const clearIncidentFilter = () => {
    navigate("/emails");
  };

  const formatSentAt = (sentAt?: string) => {
    if (!sentAt) return "Date inconnue";
    try {
      return format(parseISO(sentAt), "dd/MM/yyyy 'à' HH:mm");
    } catch {
      return sentAt;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-lg text-red-400 inline-block">
          Erreur lors du chargement des journaux d'emails.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Mail className="text-sky-400" size={24} />
          <span>Emails envoyés</span>
        </h1>
        <p className="text-sm text-slate-400">
          Historique des notifications d'alertes dépêchées par le pipeline opérationnel
        </p>
      </div>

      {/* Active Incident Filter Banner */}
      {incidentIdParam && (
        <div className="flex items-center justify-between bg-sky-950/40 border border-sky-800/80 p-3 rounded-lg text-sky-400 text-sm">
          <div className="flex items-center gap-2">
            <Mail size={16} />
            <span>
              Filtre actif : Notifications de l'incident{" "}
              <strong className="font-mono bg-sky-900 px-1.5 py-0.5 rounded text-xs">
                {incidentIdParam}
              </strong>
            </span>
          </div>
          <button
            onClick={clearIncidentFilter}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs text-slate-300 font-medium transition-colors"
            title="Effacer le filtre"
          >
            <X size={12} />
            <span>Réinitialiser</span>
          </button>
        </div>
      )}

      {/* Tabs list */}
      <div className="flex border-b border-slate-800 gap-1">
        {(["Tous", "Envoyés", "Simulés", "Échecs"] as StatusTabType[]).map((tab) => {
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

      {/* Cards list container */}
      {filteredEmails.length === 0 ? (
        <EmptyState
          message="Aucune notification envoyée."
          icon={<Mail size={32} />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEmails.map((email) => (
            <div
              key={email.email_id}
              onClick={() => setSelectedEmail(email)}
              className="bg-slate-800/40 border border-slate-700 rounded-lg p-5 flex flex-col justify-between space-y-4 hover:border-slate-500 hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-100 leading-snug line-clamp-2">
                  {email.subject}
                </h3>
                <div className="flex-shrink-0">
                  <Badge severity={getStatusSeverity(email.status)}>
                    {getStatusLabel(email.status)}
                  </Badge>
                </div>
              </div>

              {/* Body */}
              <div className="text-xs space-y-2 border-t border-slate-700/60 pt-3 text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Destinataire</span>
                  <span className="font-semibold text-slate-200">{email.recipient}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Éolienne</span>
                  <span className="font-bold text-slate-200">{email.turbine_id}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Sévérité alerte</span>
                  <div>
                    <Badge severity={email.severity} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Date d'envoi</span>
                  <span className="font-medium text-slate-400">
                    {formatSentAt(email.sent_at)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-700/40 pt-3 text-[10px]">
                {/* Link to incident if present */}
                {email.incident_id ? (
                  <Link
                    to={`/incidents/${email.incident_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 hover:underline text-xs"
                  >
                    <span>→ Voir l'incident</span>
                  </Link>
                ) : (
                  <span className="text-slate-600 font-mono">Pas d'incident lié</span>
                )}

                <span className="font-mono text-slate-500">{email.email_id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over detail panel */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedEmail(null)}
          />

          {/* Sliding panel */}
          <div className="relative w-full max-w-lg bg-slate-900 border-l border-slate-800 p-6 shadow-2xl flex flex-col justify-between text-slate-100 z-10 animate-slide-in">
            <div className="space-y-6 min-h-0">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Mail size={18} className="text-sky-500" />
                  <span>Détail de l'email</span>
                </h2>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="rounded-full p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Fermer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Subject + status */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Sujet
                  </label>
                  <p className="text-sm font-medium bg-slate-950/60 border border-slate-850 p-3 rounded-md text-slate-200">
                    {selectedEmail.subject}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge severity={getStatusSeverity(selectedEmail.status)}>
                    {getStatusLabel(selectedEmail.status)}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {formatSentAt(selectedEmail.sent_at)}
                  </span>
                </div>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Destinataire
                  </label>
                  <span className="text-sm font-medium text-slate-200">
                    {selectedEmail.recipient}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Éolienne
                  </label>
                  <span className="text-sm font-bold text-slate-200">
                    {selectedEmail.turbine_id}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Sévérité
                  </label>
                  <Badge severity={selectedEmail.severity} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    ID email
                  </label>
                  <span className="font-mono text-xs text-slate-400">
                    {selectedEmail.email_id}
                  </span>
                </div>
              </div>

              {/* Incident link */}
              {selectedEmail.incident_id && (
                <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 mb-2">
                    Cet email est lié à un incident.
                  </p>
                  <Link
                    to={`/incidents/${selectedEmail.incident_id}`}
                    onClick={() => setSelectedEmail(null)}
                    className="text-sm text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1.5 hover:underline"
                  >
                    <span>Voir l'incident</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}

              {/* Body */}
              <div className="min-h-0 flex flex-col">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Corps du message
                </label>
                <div className="flex-1 overflow-y-auto bg-white text-slate-900 rounded-md p-4 text-sm">
                  {selectedEmail.body ? (
                    <div
                      className="email-body prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                    />
                  ) : (
                    <p className="text-slate-500 italic">Aucun contenu disponible.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer close button */}
            <div className="border-t border-slate-800 pt-4 mt-6">
              <button
                onClick={() => setSelectedEmail(null)}
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

export default EmailLogs;
