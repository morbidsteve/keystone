import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getStatusColor } from '@/lib/utils';
import { SUPPLY_CLASS_SHORT } from '@/lib/constants';
import type { SupplyClassSummary } from '@/lib/types';

interface SupplyStatusCardProps {
  data: SupplyClassSummary;
  onClick?: () => void;
}

export default function SupplyStatusCard({ data, onClick }: SupplyStatusCardProps) {
  const color = getStatusColor(data.status);
  const TrendIcon =
    data.trend === 'UP' ? TrendingUp : data.trend === 'DOWN' ? TrendingDown : Minus;

  return (
    <div
      onClick={onClick}
      className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] py-3 px-3.5" style={{ borderLeft: `3px solid ${color}`, cursor: onClick ? 'pointer' : 'default', transition: 'background-color var(--transition)' }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
      }}
    >
      {/* Header */}
      <div
        className="flex justify-between items-center mb-2"
      >
        <span
          className="font-[var(--font-mono)] text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)]"
        >
          {SUPPLY_CLASS_SHORT[data.supplyClass] || data.supplyClass}
        </span>
        <TrendIcon
          size={14}
          style={{
            color:
              data.trend === 'UP'
                ? 'var(--color-success)'
                : data.trend === 'DOWN'
                ? 'var(--color-danger)'
                : 'var(--color-text-muted)',
          }}
        />
      </div>

      {/* Percentage */}
      <div
        className="font-[var(--font-mono)] text-2xl font-bold leading-none mb-2" style={{ color: color }}
      >
        {Math.round(data.percentage)}%
      </div>

      {/* Progress Bar */}
      <div
        className="w-full h-[4px] bg-[var(--color-bg)] rounded-[2px] overflow-hidden mb-2"
      >
        <div
          className="h-full rounded-[2px]" style={{ width: `${Math.min(data.percentage, 100)}%`, backgroundColor: color, transition: 'width 0.5s ease' }}
        />
      </div>

      {/* Details */}
      <div
        className="flex justify-between font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]"
      >
        <span>
          {data.onHand}/{data.authorized}
        </span>
        <span>{data.dos}D DOS</span>
      </div>
    </div>
  );
}
