import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import type { MaintenanceAnalytics } from '@/lib/types';

interface TopFaultsChartProps {
  faults: MaintenanceAnalytics['topFaults'];
  height?: number;
}

const BAR_COLORS = [
  'var(--color-danger)',
  '#f97316',
  'var(--color-warning)',
  '#a3e635',
  'var(--color-accent)',
  '#06b6d4',
  '#8b5cf6',
  '#ec4899',
  '#6366f1',
  '#14b8a6',
];

export default function TopFaultsChart({ faults, height = 280 }: TopFaultsChartProps) {
  if (faults.length === 0) {
    return (
      <div
        className="items-center justify-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]" style={{ height,
          display: 'flex' }}
      >
        No fault data available
      </div>
    );
  }

  // Prepare data for horizontal bar chart — truncate long descriptions
  const chartData = faults.map((f) => ({
    name: f.faultDescription.length > 25
      ? f.faultDescription.slice(0, 22) + '...'
      : f.faultDescription,
    fullName: f.faultDescription,
    equipmentType: f.equipmentType,
    count: f.count,
  }));

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: { fullName: string; equipmentType: string; count: number } }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)] rounded-[var(--radius)] py-2 px-3 font-[var(--font-mono)] text-[11px]"
        >
          <div className="text-[var(--color-text-bright)] mb-1">
            {data.fullName}
          </div>
          <div className="text-[var(--color-text-muted)]">
            {data.equipmentType} — {data.count} occurrences
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
      >
        <CartesianGrid
          stroke="var(--color-border)"
          strokeDasharray="3 3"
          strokeOpacity={0.4}
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fill: 'var(--color-text-muted)',
          }}
          axisLine={{ stroke: 'var(--color-border)' }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={160}
          tick={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fill: 'var(--color-text-muted)',
          }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={16}>
          {chartData.map((_entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={BAR_COLORS[index % BAR_COLORS.length]}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
