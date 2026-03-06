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
        className="items-center justify-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]" style={{ height,
          display: 'flex' }}
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
          className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)] rounded-[var(--radius)] py-2 px-3 font-[var(--font-mono)] text-[11px]"
        >
          <div className="text-[var(--color-text-muted)] mb-1">
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
      <div className="flex gap-5 justify-center mt-2">
        <div className="flex items-center gap-1.5">
          <div
            className="w-[12px] h-[8px] bg-[var(--color-accent)] rounded-[1px] opacity-60"
          />
          <span
            className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[0.5px]"
          >
            LABOR HOURS
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-[12px] h-[2px] bg-[var(--color-warning)]"
          />
          <span
            className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[0.5px]"
          >
            WORK ORDERS
          </span>
        </div>
      </div>
    </div>
  );
}
