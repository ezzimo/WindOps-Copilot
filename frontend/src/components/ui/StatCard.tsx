import type { ReactNode } from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "stable";
  icon?: ReactNode;
}

const trendConfig = {
  up: { icon: ArrowUp, color: "text-emerald-400" },
  down: { icon: ArrowDown, color: "text-red-400" },
  stable: { icon: Minus, color: "text-slate-400" },
};

export function StatCard({ label, value, trend, icon }: StatCardProps) {
  const TrendIcon = trend ? trendConfig[trend].icon : null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
        <span>{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-slate-100">{value}</span>
        {trend && TrendIcon && (
          <TrendIcon
            className={`h-4 w-4 ${trendConfig[trend].color}`}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

export default StatCard;
