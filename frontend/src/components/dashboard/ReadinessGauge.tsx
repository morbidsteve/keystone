import { getStatusColor, getReadinessStatus } from '@/lib/utils';

interface ReadinessGaugeProps {
  percent: number;
  label: string;
  size?: number;
}

export default function ReadinessGauge({ percent, label, size = 80 }: ReadinessGaugeProps) {
  const status = getReadinessStatus(percent);
  const color = getStatusColor(status);
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div
      className="flex flex-col items-center gap-1.5"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-bg)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* Center text */}
        <div
          className="absolute font-[var(--font-mono)] font-bold" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: size > 60 ? 18 : 14, color: color }}
        >
          {Math.round(percent)}%
        </div>
      </div>
      <span
        className="font-[var(--font-mono)] text-[9px] uppercase tracking-[1px] text-[var(--color-text-muted)] text-center" style={{ maxWidth: size + 20 }}
      >
        {label}
      </span>
    </div>
  );
}
