// =============================================================================
// ReadinessRollupTree — Hierarchical unit readiness view
// =============================================================================

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import RatingBadge from './RatingBadge';
import { useDashboardStore } from '@/stores/dashboardStore';
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
  const setSelectedUnitId = useDashboardStore((s) => s.setSelectedUnitId);
  const borderColor = getBorderColor(sub.cRating);
  const hasPct = sub.overallReadinessPct != null;
  const pctColor = hasPct ? getTextColor(sub.overallReadinessPct) : 'var(--color-text-muted)';

  const handleRowClick = () => {
    if (sub.limitingFactor) {
      setExpanded(!expanded);
    }
    setSelectedUnitId(String(sub.unitId));
  };

  return (
    <div
      className="mb-0.5" style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <div
        onClick={handleRowClick}
        className="flex items-center gap-2.5 py-2.5 px-3 bg-[var(--color-bg-elevated)] cursor-pointer transition-colors duration-[var(--transition)]"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
        }}
      >
        {/* Expand/collapse icon */}
        <span className="w-[14px] shrink-0 text-[var(--color-text-muted)]">
          {sub.limitingFactor ? (
            expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : null}
        </span>

        {/* Unit name + echelon label */}
        <span
          className="flex-1 font-[var(--font-mono)] text-xs font-semibold text-[var(--color-text-bright)]"
        >
          {sub.unitName}
          {sub.echelonLabel && (
            <span
              className="font-normal text-[10px] text-[var(--color-text-muted)] ml-1.5"
            >
              ({sub.echelonLabel})
            </span>
          )}
        </span>

        {/* Rating badge */}
        <RatingBadge rating={sub.cRating} />

        {/* Percentage */}
        <span
          className="font-[var(--font-mono)] text-sm font-bold min-w-[50px] text-right" style={{ color: pctColor }}
        >
          {hasPct ? `${Math.round(sub.overallReadinessPct)}%` : 'N/A'}
        </span>
      </div>

      {/* Expanded limiting factor detail */}
      {expanded && sub.limitingFactor && (
        <div
          className="bg-[var(--color-bg)] border-t border-t-[var(--color-border)]" style={{ padding: '8px 12px 8px 40px' }}
        >
          <span
            className="font-[var(--font-mono)] text-[9px] text-[var(--color-warning)] leading-[1.4]"
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
    <div className="flex flex-col gap-0">
      {/* Parent header */}
      <div
        className="flex items-center justify-between py-3 px-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius) var(--radius) 0 0] mb-0.5"
      >
        <div>
          <span
            className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-text-bright)] tracking-[0.5px]"
          >
            {parentUnitName}
          </span>
          <span
            className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] ml-2.5 uppercase tracking-[1px]"
          >
            {subordinates.length} SUBORDINATE{subordinates.length !== 1 ? 'S' : ''}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] uppercase tracking-[1px]"
          >
            AVG
          </span>
          <span
            className="font-[var(--font-mono)] text-lg font-bold" style={{ color: avgColor }}
          >
            {Math.round(avgOverallPct)}%
          </span>
        </div>
      </div>

      {/* Subordinate rows */}
      <div
        className="border border-[var(--color-border)] rounded-[0 0 var(--radius) var(--radius)] overflow-hidden border-t-0"
      >
        {subordinates.map((sub) => (
          <SubordinateRow key={sub.unitId} sub={sub} />
        ))}
      </div>
    </div>
  );
}
