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
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
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
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'var(--font-mono)',
            fontSize: size > 60 ? 18 : 14,
            fontWeight: 700,
            color: color,
          }}
        >
          {Math.round(percent)}%
        </div>
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          maxWidth: size + 20,
        }}
      >
        {label}
      </span>
    </div>
  );
}
