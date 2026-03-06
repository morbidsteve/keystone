// =============================================================================
// ReadinessGauge — SVG circular gauge with color-coded readiness percentage
// =============================================================================

import RatingBadge from './RatingBadge';

type DrillDownDomain = 'equipment' | 'supply' | 'personnel' | 'training';
type GaugeDomain = DrillDownDomain | 'overall';

interface ReadinessGaugeProps {
  percentage: number;
  rating?: string;
  size?: number;
  label?: string;
  domain?: GaugeDomain;
  onDrillDown?: (domain: DrillDownDomain) => void;
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
  domain,
  onDrillDown,
}: ReadinessGaugeProps) {
  const color = getGaugeColor(percentage);
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const drillDownDomain = domain && domain !== 'overall' ? domain : null;
  const isClickable = !!(drillDownDomain && onDrillDown);

  return (
    <div
      onClick={() => {
        if (drillDownDomain && onDrillDown) {
          onDrillDown(drillDownDomain);
        }
      }}
      className="flex flex-col items-center gap-1.5 opacity-100" style={{ cursor: isClickable ? 'pointer' : 'default', transition: 'opacity var(--transition)' }}
      onMouseEnter={(e) => {
        if (isClickable) e.currentTarget.style.opacity = '0.8';
      }}
      onMouseLeave={(e) => {
        if (isClickable) e.currentTarget.style.opacity = '1';
      }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
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
          className="absolute font-[var(--font-mono)] font-bold" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: size > 60 ? 18 : 14, color: color }}
        >
          {Math.round(percentage)}%
        </div>
      </div>

      {/* Label below gauge */}
      {label && (
        <span
          className="font-[var(--font-mono)] text-[9px] uppercase tracking-[1px] text-[var(--color-text-muted)] text-center" style={{ maxWidth: size + 20 }}
        >
          {label}
        </span>
      )}

      {/* Rating badge below label */}
      {rating && <RatingBadge rating={rating} />}
    </div>
  );
}
