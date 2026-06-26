import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { apiClient } from "../../api/client";

function useApiStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        await apiClient.get("/health", { timeout: 3000 });
        if (!cancelled) setOnline(true);
      } catch {
        if (!cancelled) setOnline(false);
      }
    };

    check();
    const interval = setInterval(check, 10_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return online;
}

function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  const labelMap: Record<string, string> = {
    "": "Dashboard",
    incidents: "Incidents",
    alerts: "Alertes",
    metrics: "Métriques",
    emails: "Emails",
    simulate: "Simulation",
  };

  return (
    <nav className="flex items-center gap-2 text-sm text-slate-400">
      <Link to="/" className="hover:text-slate-200">
        WindOps
      </Link>
      {segments.map((segment, index) => {
        const path = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;
        const label = labelMap[segment] ?? segment;

        return (
          <span key={path} className="flex items-center gap-2">
            <span className="text-slate-600">/</span>
            {isLast ? (
              <span className="font-medium text-slate-100">{label}</span>
            ) : (
              <Link to={path} className="hover:text-slate-200">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function Header() {
  const online = useApiStatus();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
      <Breadcrumb />

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              online === true
                ? "bg-emerald-400"
                : online === false
                ? "bg-red-400"
                : "bg-amber-400"
            }`}
          />
          <span>
            {online === true
              ? "API connectée"
              : online === false
              ? "API déconnectée"
              : "Vérification API..."}
          </span>
        </div>

        <span className="hidden text-xs text-slate-500 sm:inline">
          WindOps Copilot v1.0
        </span>
      </div>
    </header>
  );
}

export default Header;
