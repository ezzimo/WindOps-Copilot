interface AgentStatusDotProps {
  status: "healthy" | "degraded" | "error";
  name: string;
}

const statusConfig = {
  healthy: {
    dot: "bg-emerald-400",
    animation: "animate-pulse",
    text: "text-emerald-400",
  },
  degraded: {
    dot: "bg-amber-400",
    animation: "animate-pulse",
    text: "text-amber-400",
  },
  error: {
    dot: "bg-red-400",
    animation: "animate-ping",
    text: "text-red-400",
  },
};

export function AgentStatusDot({ status, name }: AgentStatusDotProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot} ${config.animation}`}
        />
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${config.dot}`}
        />
      </span>
      <span className={`text-sm font-medium ${config.text}`}>{name}</span>
    </div>
  );
}

export default AgentStatusDot;
