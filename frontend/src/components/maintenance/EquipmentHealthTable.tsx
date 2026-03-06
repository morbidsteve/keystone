// =============================================================================
// EquipmentHealthTable — MTBF, MTTR, trend arrows, health score badges
// =============================================================================

import { useQuery } from '@tanstack/react-query';
import { getMTBFMTTR } from '@/api/maintenanceAnalytics';
import type { MTBFMTTRData } from '@/api/maintenanceAnalytics';

interface EquipmentHealthTableProps {
  unitId: number;
}

function getTrendDisplay(trend: MTBFMTTRData['mtbf_trend']): { symbol: string; color: string } {
  switch (trend) {
    case 'IMPROVING':
      return { symbol: '\u2191', color: 'var(--color-success)' };
    case 'DEGRADING':
      return { symbol: '\u2193', color: 'var(--color-danger)' };
    case 'STABLE':
    default:
      return { symbol: '\u2192', color: 'var(--color-text-muted)' };
  }
}

function getHealthBadgeStyle(score: number): React.CSSProperties {
  let bg: string;
  let color: string;
  if (score >= 70) {
    bg = 'rgba(16, 185, 129, 0.15)';
    color = 'var(--color-success)';
  } else if (score >= 50) {
    bg = 'rgba(245, 158, 11, 0.15)';
    color = 'var(--color-warning)';
  } else {
    bg = 'rgba(239, 68, 68, 0.15)';
    color = 'var(--color-danger)';
  }
  return {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 'var(--radius)',
    backgroundColor: bg,
    color,
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: '0.5px',
  };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function EquipmentHealthTable({ unitId }: EquipmentHealthTableProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['mtbf-mttr', unitId],
    queryFn: () => getMTBFMTTR(unitId),
  });

  if (isLoading) {
    return <div className="skeleton w-full h-[300px]"  />;
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="h-[200px] flex items-center justify-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
      >
        No equipment health data available
      </div>
    );
  }

  const headers = ['EQUIPMENT', 'MTBF (DAYS)', 'MTTR (HRS)', 'TREND', 'CORR. WOs', 'LAST CORR.', 'HEALTH'];

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-collapse font-[var(--font-mono)] text-[11px]"
      >
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="text-left py-2 px-3 border-b border-b-[var(--color-border)] text-[var(--color-text-muted)] text-[9px] font-semibold tracking-[1px] uppercase"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const trend = getTrendDisplay(row.mtbf_trend);
            return (
              <tr key={row.equipment_type}>
                <td
                  className="py-2 px-3 border-b border-b-[var(--color-border)] text-[var(--color-text-bright)] font-semibold"
                >
                  {row.equipment_type}
                </td>
                <td
                  className="py-2 px-3 border-b border-b-[var(--color-border)] text-[var(--color-text-bright)]"
                >
                  {row.mtbf_days.toFixed(1)}
                </td>
                <td
                  className="py-2 px-3 border-b border-b-[var(--color-border)] text-[var(--color-text-bright)]"
                >
                  {row.mttr_hours.toFixed(1)}
                </td>
                <td
                  className="py-2 px-3 border-b border-b-[var(--color-border)] font-bold text-sm" style={{ color: trend.color }}
                >
                  {trend.symbol}{' '}
                  <span className="text-[9px] font-normal">{row.mtbf_trend}</span>
                </td>
                <td
                  className="py-2 px-3 border-b border-b-[var(--color-border)] text-[var(--color-text-bright)]"
                >
                  {row.corrective_wos_total}
                </td>
                <td
                  className="py-2 px-3 border-b border-b-[var(--color-border)] text-[var(--color-text-muted)]"
                >
                  {formatDate(row.last_corrective_date)}
                </td>
                <td
                  className="py-2 px-3 border-b border-b-[var(--color-border)]"
                >
                  <span style={getHealthBadgeStyle(row.health_score)}>
                    {row.health_score}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
