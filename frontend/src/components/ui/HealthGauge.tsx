interface HealthGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-16 w-16",
  md: "h-24 w-24",
  lg: "h-32 w-32",
};

const textClasses = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-3xl",
};

export function HealthGauge({ score, size = "md" }: HealthGaugeProps) {
  const clampedScore = Math.min(Math.max(score, 0), 1);
  const percentage = Math.round(clampedScore * 100);

  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength * (1 - clampedScore);

  const color =
    clampedScore > 0.7
      ? "text-emerald-400"
      : clampedScore > 0.4
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <svg
        className="h-full w-full -rotate-[135deg] transform"
        viewBox="0 0 120 120"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-700"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className={color}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold ${textClasses[size]} ${color}`}>
          {percentage}%
        </span>
      </div>
    </div>
  );
}

export default HealthGauge;
