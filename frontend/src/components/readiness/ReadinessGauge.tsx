// =============================================================================
// ReadinessGauge — SVG circular gauge with color-coded readiness percentage
// =============================================================================

import RatingBadge from './RatingBadge';

interface ReadinessGaugeProps {
  percentage: number;
  rating?: string;
  size?: number;
  label?: string;
}

function getGaugeColor(pct: number): string {
  if (pct >= 90) return '#4ade80';
  if (pct >= 75) return '#fbbf24';
  if (pct >= 60) return '#fb923c';
  return '#f87171';
}

export default function ReadinessGauge({
  percentage,
  rating,
  size = 80,
  label,
}: ReadinessGaugeProps) {
  const color = getGaugeColor(percentage);
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

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
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
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
        {/* Center percentage text */}
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
          {Math.round(percentage)}%
        </div>
      </div>

      {/* Label below gauge */}
      {label && (
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
      )}

      {/* Rating badge below label */}
      {rating && <RatingBadge rating={rating} />}
    </div>
  );
}
