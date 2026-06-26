import { formatRelative } from "../lib/date";
import { AlertTriangle } from "lucide-react";
import type { TurbineStatus, TurbineStatusValue, Severity } from "../types";

function statusToSeverity(status: TurbineStatusValue): Severity {
  switch (status) {
    case "normal":
      return "low";
    case "warning":
      return "medium";
    case "critical":
      return "critical";
    case "offline":
      return "critical";
    default:
      return "low";
  }
}
import { Badge } from "./ui/Badge";
import { HealthGauge } from "./ui/HealthGauge";

interface TurbineCardProps {
  turbine: TurbineStatus;
  onClick?: (turbine: TurbineStatus) => void;
  onAlertClick?: (alertId: string) => void;
}

export function TurbineCard({
  turbine,
  onClick,
  onAlertClick,
}: TurbineCardProps) {
  const handleAlertClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (turbine.active_alert_id) {
      onAlertClick?.(turbine.active_alert_id);
    }
  };

  return (
    <div
      onClick={() => onClick?.(turbine)}
      className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800 p-5 shadow-sm transition-colors hover:border-slate-600 hover:bg-slate-700"
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">
            {turbine.name}
          </h3>
          <p className="text-xs text-slate-400">{turbine.turbine_id}</p>
        </div>
        <Badge severity={statusToSeverity(turbine.status)}>
          {turbine.status}
        </Badge>
      </div>

      <div className="mb-4 flex justify-center">
        <HealthGauge score={turbine.health_score} size="md" />
      </div>

      <p className="mb-3 text-center text-xs text-slate-400">
        Vu {formatRelative(turbine.last_seen)}
      </p>

      {turbine.active_alert_id && (
        <button
          type="button"
          onClick={handleAlertClick}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-red-900/30 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/50"
        >
          <AlertTriangle className="h-4 w-4" />
          Voir alerte
        </button>
      )}
    </div>
  );
}

export default TurbineCard;
