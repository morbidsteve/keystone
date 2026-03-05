// =============================================================================
// ReadinessRollupTree — Hierarchical unit readiness view
// =============================================================================

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import RatingBadge from './RatingBadge';
import type { ReadinessRollup } from '@/lib/types';

interface ReadinessRollupTreeProps {
  parentUnitName: string;
  subordinates: ReadinessRollup['subordinates'];
  avgOverallPct: number;
}

function getBorderColor(rating: string): string {
  const level = rating.split('-')[1];
  switch (level) {
    case '1': return '#4ade80';
    case '2': return '#fbbf24';
    case '3': return '#fb923c';
    case '4': default: return '#f87171';
  }
}

function getTextColor(pct: number): string {
  if (pct >= 90) return '#4ade80';
  if (pct >= 75) return '#fbbf24';
  if (pct >= 60) return '#fb923c';
  return '#f87171';
}

interface SubordinateRowProps {
  sub: ReadinessRollup['subordinates'][number];
}

function SubordinateRow({ sub }: SubordinateRowProps) {
  const [expanded, setExpanded] = useState(false);
  const borderColor = getBorderColor(sub.cRating);
  const pctColor = getTextColor(sub.overallReadinessPct);

  return (
    <div
      style={{
        borderLeft: `3px solid ${borderColor}`,
        marginBottom: 2,
      }}
    >
      <div
        onClick={() => sub.limitingFactor && setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          backgroundColor: 'var(--color-bg-elevated)',
          cursor: sub.limitingFactor ? 'pointer' : 'default',
          transition: 'background-color var(--transition)',
        }}
        onMouseEnter={(e) => {
          if (sub.limitingFactor) {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
        }}
      >
        {/* Expand/collapse icon */}
        <span style={{ width: 14, flexShrink: 0, color: 'var(--color-text-muted)' }}>
          {sub.limitingFactor ? (
            expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : null}
        </span>

        {/* Unit name */}
        <span
          style={{
            flex: 1,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--color-text-bright)',
          }}
        >
          {sub.unitName}
        </span>

        {/* Rating badge */}
        <RatingBadge rating={sub.cRating} />

        {/* Percentage */}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 700,
            color: pctColor,
            minWidth: 50,
            textAlign: 'right',
          }}
        >
          {Math.round(sub.overallReadinessPct)}%
        </span>
      </div>

      {/* Expanded limiting factor detail */}
      {expanded && sub.limitingFactor && (
        <div
          style={{
            padding: '8px 12px 8px 40px',
            backgroundColor: 'var(--color-bg)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--color-warning)',
              lineHeight: 1.4,
            }}
          >
            LIMFAC: {sub.limitingFactor}
          </span>
        </div>
      )}
    </div>
  );
}

export default function ReadinessRollupTree({
  parentUnitName,
  subordinates,
  avgOverallPct,
}: ReadinessRollupTreeProps) {
  const avgColor = getTextColor(avgOverallPct);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Parent header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius) var(--radius) 0 0',
          marginBottom: 2,
        }}
      >
        <div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
              letterSpacing: '0.5px',
            }}
          >
            {parentUnitName}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--color-text-muted)',
              marginLeft: 10,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            {subordinates.length} SUBORDINATE{subordinates.length !== 1 ? 'S' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            AVG
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 18,
              fontWeight: 700,
              color: avgColor,
            }}
          >
            {Math.round(avgOverallPct)}%
          </span>
        </div>
      </div>

      {/* Subordinate rows */}
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderTop: 'none',
          borderRadius: '0 0 var(--radius) var(--radius)',
          overflow: 'hidden',
        }}
      >
        {subordinates.map((sub) => (
          <SubordinateRow key={sub.unitId} sub={sub} />
        ))}
      </div>
    </div>
  );
}
