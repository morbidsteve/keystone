// =============================================================================
// ReadinessCard — Unit readiness summary card with rating badge
// =============================================================================

import RatingBadge from './RatingBadge';

interface ReadinessCardProps {
  unitId: number;
  unitName: string;
  cRating: string;
  overallReadinessPct: number;
  limitingFactor?: string;
  onClick?: () => void;
}

function getBarColor(pct: number): string {
  if (pct >= 90) return '#4ade80';
  if (pct >= 75) return '#fbbf24';
  if (pct >= 60) return '#fb923c';
  return '#f87171';
}

export default function ReadinessCard({
  unitName,
  cRating,
  overallReadinessPct,
  limitingFactor,
  onClick,
}: ReadinessCardProps) {
  const barColor = getBarColor(overallReadinessPct);
  const isCritical = cRating === 'C-3' || cRating === 'C-4';

  return (
    <div
      onClick={onClick}
      className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] p-4" style={{ cursor: onClick ? 'pointer' : 'default', transition: 'all var(--transition)', borderLeft: isCritical ? '3px solid var(--color-danger)' : undefined, backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.04)' : undefined }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'var(--color-border-strong)';
          e.currentTarget.style.backgroundColor = isCritical ? 'rgba(239, 68, 68, 0.08)' : 'var(--color-bg-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.backgroundColor = isCritical ? 'rgba(239, 68, 68, 0.04)' : 'var(--color-bg-elevated)';
        }
      }}
    >
      {/* Top: unit name + rating badge */}
      <div
        className="flex items-center justify-between mb-2.5"
      >
        <span
          className="font-[var(--font-mono)] text-xs font-semibold text-[var(--color-text-bright)] tracking-[0.5px]"
        >
          {unitName}
        </span>
        <RatingBadge rating={cRating} />
      </div>

      {/* Percentage + progress bar */}
      <div className="mb-2">
        <div
          className="flex items-baseline justify-between mb-1"
        >
          <span
            className="font-[var(--font-mono)] text-[22px] font-bold" style={{ color: barColor }}
          >
            {Math.round(overallReadinessPct)}%
          </span>
          <span
            className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] uppercase tracking-[1px]"
          >
            OVERALL
          </span>
        </div>
        {/* Progress bar */}
        <div
          className="w-full h-[4px] bg-[rgba(255,255,255,0.06)] rounded-[2px] overflow-hidden"
        >
          <div
            className="h-full rounded-[2px]" style={{ width: `${overallReadinessPct}%`, backgroundColor: barColor, transition: 'width 0.4s ease' }}
          />
        </div>
      </div>

      {/* Limiting factor */}
      {limitingFactor && (
        <div
          className="font-[var(--font-mono)] text-[9px] text-[var(--color-warning)] leading-[1.4] mt-2 py-1.5 px-2 bg-[rgba(251,191,36,0.06)] rounded-[var(--radius)]" style={{ border: '1px solid rgba(251, 191, 36, 0.15)' }}
        >
          LIMFAC: {limitingFactor}
        </div>
      )}
    </div>
  );
}
