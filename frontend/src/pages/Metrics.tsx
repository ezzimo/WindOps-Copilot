import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Clock, Cpu, BarChart3, TrendingUp, AlertOctagon } from "lucide-react";
import { useMetrics } from "../hooks/useWindOps";
import type { AgentMetric } from "../types";

// UI Components
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import Table from "../components/ui/Table";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export function Metrics() {
  const { data: metrics, isLoading, error } = useMetrics();
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);

  // Reset clock when new metrics data is received
  useEffect(() => {
    setSecondsSinceUpdate(0);
  }, [metrics]);

  // Tick timer every second to show relative update time
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSinceUpdate((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format health history data for LineChart
  const chartData = metrics?.health_score_history || [];

  const formatTime = (timeStr: string) => {
    try {
      return format(parseISO(timeStr), "HH:mm");
    } catch {
      return timeStr;
    }
  };

  // Define columns for Agent Status Table
  const agentColumns = [
    {
      key: "agent_name",
      label: "Agent",
      render: (value: any) => (
        <span className="font-semibold text-slate-200">{String(value)}</span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (value: any) => {
        const severityMap: Record<string, "normal" | "medium" | "critical"> = {
          healthy: "normal",
          degraded: "medium",
          error: "critical",
        };
        return (
          <Badge severity={severityMap[value] ?? "normal"}>
            {value === "healthy" ? "En ligne" : value === "degraded" ? "Dégradé" : "Erreur"}
          </Badge>
        );
      },
      width: "120px",
    },
    {
      key: "avg_response_ms",
      label: "Latence moy.",
      render: (value: any) => {
        const ms = Number(value || 0);
        let color = "text-emerald-400";
        if (ms >= 2000) {
          color = "text-red-400 font-bold";
        } else if (ms >= 500) {
          color = "text-orange-400 font-semibold";
        }
        return <span className={color}>{ms} ms</span>;
      },
      width: "130px",
    },
    {
      key: "calls_last_hour",
      label: "Appels/heure",
      render: (value: any) => (
        <span className="font-mono text-slate-300">{Number(value || 0)}</span>
      ),
      width: "130px",
    },
    {
      key: "error_rate",
      label: "Taux d'erreur",
      render: (value: any) => {
        const rate = Number(value || 0);
        const percent = Math.round(rate * 1000) / 10;
        const color = rate > 0.05 ? "text-red-400 font-bold" : "text-slate-300";
        return <span className={color}>{percent}%</span>;
      },
      width: "130px",
    },
    {
      key: "tokens_used_today",
      label: "Tokens aujourd'hui",
      render: (value: any) => (
        <span className="font-mono text-slate-400">{Number(value || 0).toLocaleString()}</span>
      ),
      width: "160px",
    },
  ];

  if (isLoading && !metrics) {
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
          Erreur lors du chargement des métriques système.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      
      {/* Title & Discret Update Indicator */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 className="text-sky-400" size={24} />
          <span>Métriques système</span>
        </h1>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
          <Clock size={12} className="animate-pulse text-slate-600" />
          <span>Mis à jour il y a {secondsSinceUpdate}s</span>
        </div>
      </div>

      {/* 2. Pipeline performance grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Latence Moyenne Pipeline"
          value={`${metrics?.pipeline_avg_ms || 0} ms`}
          icon={<Clock size={16} />}
          trend={(metrics?.pipeline_avg_ms || 0) < 1500 ? "up" : "down"}
        />
        <StatCard
          label="Incidents Résolus Aujourd'hui"
          value={metrics?.incidents_resolved_today || 0}
          icon={<TrendingUp size={16} />}
          trend="stable"
        />
        <StatCard
          label="Score Santé Moyen"
          value={`${Math.round((metrics?.avg_health_score || 0) * 100)}%`}
          icon={<AlertOctagon size={16} />}
          trend={(metrics?.avg_health_score || 0) > 0.85 ? "up" : "down"}
        />
      </div>

      {/* 3. Health Score LineChart */}
      <section className="bg-slate-800/40 border border-slate-700 p-6 rounded-lg space-y-4">
        <h2 className="text-md font-bold text-slate-200">
          Évolution du score de santé
        </h2>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime} 
                stroke="#64748b" 
                fontSize={11}
              />
              <YAxis 
                domain={[0, 1]} 
                tickFormatter={(val) => `${Math.round(val * 100)}%`} 
                stroke="#64748b" 
                fontSize={11}
              />
              <Tooltip
                labelFormatter={(label) => {
                  try {
                    return format(parseISO(label), "dd/MM/yyyy HH:mm:ss");
                  } catch {
                    return label;
                  }
                }}
                formatter={(value: any) => [`${Math.round(Number(value || 0) * 100)}%`, "Score Moyen"]}
                contentStyle={{ backgroundColor: "#1e293b", borderColor: "#475569", borderRadius: "6px" }}
                labelStyle={{ color: "#94a3b8", fontWeight: "bold", fontSize: "12px" }}
                itemStyle={{ color: "#34d399", fontSize: "13px" }}
              />
              <Line 
                type="monotone" 
                dataKey="avg_score" 
                stroke="#34d399" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 4. Agents Status Section */}
      <section className="space-y-4">
        <h2 className="text-md font-bold text-slate-200 flex items-center gap-2">
          <Cpu size={16} className="text-slate-400" />
          <span>État des agents IA</span>
        </h2>
        <Table<AgentMetric>
          columns={agentColumns}
          data={metrics?.agents || []}
        />
      </section>

    </div>
  );
}

export default Metrics;
