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

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: 16,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all var(--transition)',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'var(--color-border-strong)';
          e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
        }
      }}
    >
      {/* Top: unit name + rating badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--color-text-bright)',
            letterSpacing: '0.5px',
          }}
        >
          {unitName}
        </span>
        <RatingBadge rating={cRating} />
      </div>

      {/* Percentage + progress bar */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 22,
              fontWeight: 700,
              color: barColor,
            }}
          >
            {Math.round(overallReadinessPct)}%
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            OVERALL
          </span>
        </div>
        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: 4,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${overallReadinessPct}%`,
              height: '100%',
              backgroundColor: barColor,
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Limiting factor */}
      {limitingFactor && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--color-warning)',
            lineHeight: 1.4,
            marginTop: 8,
            padding: '6px 8px',
            backgroundColor: 'rgba(251, 191, 36, 0.06)',
            border: '1px solid rgba(251, 191, 36, 0.15)',
            borderRadius: 'var(--radius)',
          }}
        >
          LIMFAC: {limitingFactor}
        </div>
      )}
    </div>
  );
}
