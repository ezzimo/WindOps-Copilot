import type { Severity } from "../../types";

type BadgeSeverity = Severity | "normal" | "healthy" | "degraded";

interface BadgeProps {
  severity: BadgeSeverity;
  children?: React.ReactNode;
}

const styles: Record<BadgeSeverity, string> = {
  critical:
    "bg-red-900/50 text-red-400 border border-red-700",
  high: "bg-orange-900/50 text-orange-400 border border-orange-700",
  medium: "bg-amber-900/50 text-amber-400 border border-amber-700",
  low: "bg-emerald-900/50 text-emerald-400 border border-emerald-700",
  normal: "bg-emerald-900/50 text-emerald-400 border border-emerald-700",
  healthy: "bg-emerald-900/50 text-emerald-400 border border-emerald-700",
  degraded: "bg-amber-900/50 text-amber-400",
};

export function Badge({ severity, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[severity]}`}
    >
      {children ?? severity}
    </span>
  );
}

export default Badge;
