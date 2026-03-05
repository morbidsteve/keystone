// =============================================================================
// PartsForecastTable — Forecasted parts demand sorted by total cost
// =============================================================================

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPartsForecast } from '@/api/maintenanceAnalytics';

interface PartsForecastTableProps {
  unitId: number;
  days?: number;
}

export default function PartsForecastTable({ unitId, days = 90 }: PartsForecastTableProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['parts-forecast', unitId, days],
    queryFn: () => getPartsForecast(unitId, days),
  });

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => b.total_forecast_cost - a.total_forecast_cost);
  }, [data]);

  if (isLoading) {
    return <div className="skeleton" style={{ width: '100%', height: 300 }} />;
  }

  if (!sorted.length) {
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
        No parts forecast data available
      </div>
    );
  }

  const headers = ['PART NUMBER', 'NOMENCLATURE', 'FORECAST QTY', 'EQUIPMENT TYPES', 'AVG COST', 'TOTAL COST'];
  const totalCost = sorted.reduce((s, p) => s + p.total_forecast_cost, 0);

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
          {sorted.map((row) => (
            <tr key={row.part_number}>
              <td
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-accent)',
                  fontWeight: 600,
                }}
              >
                {row.part_number}
              </td>
              <td
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-text-bright)',
                }}
              >
                {row.nomenclature}
              </td>
              <td
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-text-bright)',
                  fontWeight: 600,
                }}
              >
                {row.forecast_quantity}
              </td>
              <td
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {row.equipment_types.join(', ')}
              </td>
              <td
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-text-bright)',
                }}
              >
                ${row.avg_cost_per_part.toFixed(2)}
              </td>
              <td
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-warning)',
                  fontWeight: 600,
                }}
              >
                ${row.total_forecast_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={5}
              style={{
                padding: '8px 12px',
                borderTop: '2px solid var(--color-border)',
                color: 'var(--color-text-bright)',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '1px',
                textAlign: 'right',
              }}
            >
              TOTAL FORECAST COST
            </td>
            <td
              style={{
                padding: '8px 12px',
                borderTop: '2px solid var(--color-border)',
                color: 'var(--color-warning)',
                fontWeight: 700,
              }}
            >
              ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
