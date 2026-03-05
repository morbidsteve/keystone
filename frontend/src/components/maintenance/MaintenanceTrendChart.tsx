import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { MaintenanceAnalytics } from '@/lib/types';

interface MaintenanceTrendChartProps {
  data: MaintenanceAnalytics['weeklyTrend'];
  height?: number;
}

export default function MaintenanceTrendChart({ data, height = 280 }: MaintenanceTrendChartProps) {
  if (data.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-muted)',
        }}
      >
        No trend data available
      </div>
    );
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
    if (active && payload && payload.length) {
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
          <div style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>
            Week of {label}
          </div>
          {payload.map((p, i) => (
            <div key={i} style={{ color: p.color }}>
              {p.dataKey === 'totalHours' ? 'Labor Hours' : 'Work Orders'}: {p.value}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <CartesianGrid
            stroke="var(--color-border)"
            strokeDasharray="3 3"
            strokeOpacity={0.4}
            vertical={false}
          />
          <XAxis
            dataKey="weekStart"
            tick={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fill: 'var(--color-text-muted)',
            }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
            tickFormatter={(val: string) => val.slice(5)}
          />
          <YAxis
            yAxisId="hours"
            orientation="left"
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
          <YAxis
            yAxisId="count"
            orientation="right"
            tick={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fill: 'var(--color-text-muted)',
            }}
            axisLine={false}
            tickLine={false}
            label={{
              value: 'WOs',
              angle: 90,
              position: 'insideRight',
              style: {
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fill: 'var(--color-text-muted)',
              },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            yAxisId="hours"
            dataKey="totalHours"
            fill="var(--color-accent)"
            fillOpacity={0.6}
            radius={[2, 2, 0, 0]}
          />
          <Line
            yAxisId="count"
            type="monotone"
            dataKey="workOrderCount"
            stroke="var(--color-warning)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-warning)' }}
            activeDot={{ r: 5, fill: 'var(--color-warning)' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 12,
              height: 8,
              backgroundColor: 'var(--color-accent)',
              borderRadius: 1,
              opacity: 0.6,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.5px',
            }}
          >
            LABOR HOURS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 12,
              height: 2,
              backgroundColor: 'var(--color-warning)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.5px',
            }}
          >
            WORK ORDERS
          </span>
        </div>
      </div>
    </div>
  );
}
