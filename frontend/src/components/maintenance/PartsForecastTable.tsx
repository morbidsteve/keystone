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
    return [...data].sort((a, b) => b.totalForecastCost - a.totalForecastCost);
  }, [data]);

  if (isLoading) {
    return <div className="skeleton w-full h-[300px]"  />;
  }

  if (!sorted.length) {
    return (
      <div
        className="h-[200px] flex items-center justify-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
      >
        No parts forecast data available
      </div>
    );
  }

  const headers = ['PART NUMBER', 'NOMENCLATURE', 'FORECAST QTY', 'EQUIPMENT TYPES', 'AVG COST', 'TOTAL COST'];
  const totalCost = sorted.reduce((s, p) => s + p.totalForecastCost, 0);

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
          {sorted.map((row) => (
            <tr key={row.partNumber}>
              <td
                className="py-2 px-3 border-b border-b-[var(--color-border)] text-[var(--color-accent)] font-semibold"
              >
                {row.partNumber}
              </td>
              <td
                className="py-2 px-3 border-b border-b-[var(--color-border)] text-[var(--color-text-bright)]"
              >
                {row.nomenclature}
              </td>
              <td
                className="py-2 px-3 border-b border-b-[var(--color-border)] text-[var(--color-text-bright)] font-semibold"
              >
                {row.forecastQuantity}
              </td>
              <td
                className="py-2 px-3 border-b border-b-[var(--color-border)] text-[var(--color-text-muted)]"
              >
                {row.equipmentTypes.join(', ')}
              </td>
              <td
                className="py-2 px-3 border-b border-b-[var(--color-border)] text-[var(--color-text-bright)]"
              >
                ${(row.avgCostPerPart ?? 0).toFixed(2)}
              </td>
              <td
                className="py-2 px-3 border-b border-b-[var(--color-border)] text-[var(--color-warning)] font-semibold"
              >
                ${row.totalForecastCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={5}
              className="py-2 px-3 text-[var(--color-text-bright)] font-bold text-[10px] tracking-[1px] text-right border-t-2 border-t-[var(--color-border)]"
            >
              TOTAL FORECAST COST
            </td>
            <td
              className="py-2 px-3 text-[var(--color-warning)] font-bold border-t-2 border-t-[var(--color-border)]"
            >
              ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
