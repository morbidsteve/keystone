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
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--radius)',
        padding: '12px 14px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color var(--transition)',
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'var(--color-text-muted)',
          }}
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
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 24,
          fontWeight: 700,
          color: color,
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {Math.round(data.percentage)}%
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: 4,
          backgroundColor: 'var(--color-bg)',
          borderRadius: 2,
          overflow: 'hidden',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: `${Math.min(data.percentage, 100)}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: 2,
            transition: 'width 0.5s ease',
          }}
        />
      </div>

      {/* Details */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--color-text-muted)',
        }}
      >
        <span>
          {data.onHand}/{data.authorized}
        </span>
        <span>{data.dos}D DOS</span>
      </div>
    </div>
  );
}
