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
    return <div className="skeleton" style={{ width: '100%', height: 300 }} />;
  }

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-muted)',
        }}
      >
        No equipment health data available
      </div>
    );
  }

  const headers = ['EQUIPMENT', 'MTBF (DAYS)', 'MTTR (HRS)', 'TREND', 'CORR. WOs', 'LAST CORR.', 'HEALTH'];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
        }}
      >
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
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
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-bright)',
                    fontWeight: 600,
                  }}
                >
                  {row.equipment_type}
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-bright)',
                  }}
                >
                  {row.mtbf_days.toFixed(1)}
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-bright)',
                  }}
                >
                  {row.mttr_hours.toFixed(1)}
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--color-border)',
                    color: trend.color,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {trend.symbol}{' '}
                  <span style={{ fontSize: 9, fontWeight: 400 }}>{row.mtbf_trend}</span>
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-bright)',
                  }}
                >
                  {row.corrective_wos_total}
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {formatDate(row.last_corrective_date)}
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--color-border)',
                  }}
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
