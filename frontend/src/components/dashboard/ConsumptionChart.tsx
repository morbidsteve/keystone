import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import Card from '@/components/ui/Card';
import type { ConsumptionDataPoint } from '@/lib/types';

interface ConsumptionChartProps {
  data?: ConsumptionDataPoint[];
  title?: string;
}

const demoData: ConsumptionDataPoint[] = [
  { date: '2026-02-25', rate: 120, projected: 125 },
  { date: '2026-02-26', rate: 115, projected: 122 },
  { date: '2026-02-27', rate: 130, projected: 120 },
  { date: '2026-02-28', rate: 125, projected: 118 },
  { date: '2026-03-01', rate: 110, projected: 115 },
  { date: '2026-03-02', rate: 135, projected: 112 },
  { date: '2026-03-03', rate: 128, projected: 110 },
];

export default function ConsumptionChart({ data, title = 'CONSUMPTION RATE' }: ConsumptionChartProps) {
  const chartData = data || demoData;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
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
          <div style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
          {payload.map((p, i) => (
            <div key={i} style={{ color: p.dataKey === 'rate' ? 'var(--color-accent)' : 'var(--color-warning)' }}>
              {p.dataKey === 'rate' ? 'Actual' : 'Projected'}: {p.value}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card title={title}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <CartesianGrid
            stroke="var(--color-border)"
            strokeDasharray="3 3"
            strokeOpacity={0.4}
            vertical={false}
          />
          <XAxis
            dataKey="date"
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
            tick={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fill: 'var(--color-text-muted)',
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--color-accent)' }}
          />
          <Line
            type="monotone"
            dataKey="projected"
            stroke="var(--color-warning)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
