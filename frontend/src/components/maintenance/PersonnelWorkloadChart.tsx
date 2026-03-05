// =============================================================================
// PersonnelWorkloadChart — Stacked bar chart of labor hours per person
// =============================================================================

import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { getPersonnelWorkload } from '@/api/maintenanceAnalytics';
import type { PersonnelWorkload } from '@/api/maintenanceAnalytics';

interface PersonnelWorkloadChartProps {
  unitId: number;
  days?: number;
}

const LABOR_COLORS: Record<string, string> = {
  INSPECT: '#8b5cf6',
  DIAGNOSE: '#06b6d4',
  REPAIR: '#f59e0b',
  REPLACE: '#ef4444',
  TEST: '#10b981',
};

const LABOR_TYPES = ['INSPECT', 'DIAGNOSE', 'REPAIR', 'REPLACE', 'TEST'];

interface ChartRow {
  name: string;
  INSPECT: number;
  DIAGNOSE: number;
  REPAIR: number;
  REPLACE: number;
  TEST: number;
}

function buildChartData(data: PersonnelWorkload[]): ChartRow[] {
  return data.map((p) => ({
    name: `${p.rank} ${p.last_name}`,
    INSPECT: p.labor_breakdown.INSPECT ?? 0,
    DIAGNOSE: p.labor_breakdown.DIAGNOSE ?? 0,
    REPAIR: p.labor_breakdown.REPAIR ?? 0,
    REPLACE: p.labor_breakdown.REPLACE ?? 0,
    TEST: p.labor_breakdown.TEST ?? 0,
  }));
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-strong)',
        borderRadius: 'var(--radius)',
        padding: '8px 12px',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
      }}
    >
      <div style={{ color: 'var(--color-text-bright)', marginBottom: 4, fontWeight: 600 }}>
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span>{p.dataKey}</span>
          <span>{p.value.toFixed(1)}h</span>
        </div>
      ))}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          marginTop: 4,
          paddingTop: 4,
          color: 'var(--color-text-bright)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          fontWeight: 600,
        }}
      >
        <span>TOTAL</span>
        <span>{total.toFixed(1)}h</span>
      </div>
    </div>
  );
};

export default function PersonnelWorkloadChart({ unitId, days = 30 }: PersonnelWorkloadChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['personnel-workload', unitId, days],
    queryFn: () => getPersonnelWorkload(unitId, days),
  });

  if (isLoading) {
    return <div className="skeleton" style={{ width: '100%', height: 300 }} />;
  }

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-muted)',
        }}
      >
        No personnel workload data available
      </div>
    );
  }

  const chartData = buildChartData(data);

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <CartesianGrid
            stroke="var(--color-border)"
            strokeDasharray="3 3"
            strokeOpacity={0.4}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fill: 'var(--color-text-muted)',
            }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fill: 'var(--color-text-muted)',
            }}
            axisLine={false}
            tickLine={false}
            label={{
              value: 'Hours',
              angle: -90,
              position: 'insideLeft',
              style: {
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fill: 'var(--color-text-muted)',
              },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.5px',
            }}
          />
          {LABOR_TYPES.map((type) => (
            <Bar
              key={type}
              dataKey={type}
              stackId="labor"
              fill={LABOR_COLORS[type]}
              radius={type === 'TEST' ? [2, 2, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Summary table */}
      <div style={{ overflowX: 'auto', marginTop: 16 }}>
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
              {['RANK', 'NAME', 'MOS', 'TOTAL HRS', 'WO COUNT', 'AVG/WO'].map((h) => (
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
            {data.map((p) => (
              <tr key={p.personnel_id}>
                <td
                  style={{
                    padding: '6px 12px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-bright)',
                    fontWeight: 600,
                  }}
                >
                  {p.rank}
                </td>
                <td
                  style={{
                    padding: '6px 12px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-bright)',
                  }}
                >
                  {p.last_name}, {p.first_name}
                </td>
                <td
                  style={{
                    padding: '6px 12px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {p.mos}
                </td>
                <td
                  style={{
                    padding: '6px 12px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-accent)',
                    fontWeight: 600,
                  }}
                >
                  {p.total_hours.toFixed(1)}
                </td>
                <td
                  style={{
                    padding: '6px 12px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-bright)',
                  }}
                >
                  {p.work_order_count}
                </td>
                <td
                  style={{
                    padding: '6px 12px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {p.avg_hours_per_wo.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
