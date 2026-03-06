import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { SUPPLY_CLASS_SHORT } from '@/lib/constants';
import { getStatusColor } from '@/lib/utils';
import type { SustainabilityProjection } from '@/lib/types';
import Card from '@/components/ui/Card';

interface SustainabilityTimelineProps {
  data?: SustainabilityProjection[];
}

// Demo data for when API is not connected
const demoData: SustainabilityProjection[] = [
  { supplyClass: 'I' as never, name: 'CL I', currentDOS: 12, projectedDOS: 10, criticalThreshold: 3, status: 'GREEN' as never },
  { supplyClass: 'II' as never, name: 'CL II', currentDOS: 8, projectedDOS: 6, criticalThreshold: 3, status: 'GREEN' as never },
  { supplyClass: 'III' as never, name: 'CL III', currentDOS: 4, projectedDOS: 3, criticalThreshold: 3, status: 'AMBER' as never },
  { supplyClass: 'V' as never, name: 'CL V', currentDOS: 2, projectedDOS: 1, criticalThreshold: 3, status: 'RED' as never },
  { supplyClass: 'VIII' as never, name: 'CL VIII', currentDOS: 15, projectedDOS: 12, criticalThreshold: 3, status: 'GREEN' as never },
  { supplyClass: 'IX' as never, name: 'CL IX', currentDOS: 5, projectedDOS: 4, criticalThreshold: 3, status: 'AMBER' as never },
];

export default function SustainabilityTimeline({ data }: SustainabilityTimelineProps) {
  const chartData = (data || demoData).map((d) => ({
    name: SUPPLY_CLASS_SHORT[d.supplyClass] || d.name,
    days: d.currentDOS,
    projected: d.projectedDOS,
    threshold: d.criticalThreshold,
    status: d.status,
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div
          className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)] rounded-[var(--radius)] py-2 px-3 font-[var(--font-mono)] text-[11px]"
        >
          <div className="text-[var(--color-text-bright)] mb-1">
            {d.name}
          </div>
          <div className="text-[var(--color-text-muted)]">
            Current: {d.days}D | Projected: {d.projected}D
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card title="SUSTAINABILITY PROJECTION (DAYS OF SUPPLY)">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
          <XAxis
            type="number"
            tick={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fill: 'var(--color-text-muted)',
            }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={50}
            tick={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fill: 'var(--color-text-muted)',
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            x={3}
            stroke="var(--color-danger)"
            strokeDasharray="3 3"
            strokeOpacity={0.6}
          />
          <Bar dataKey="days" radius={[0, 2, 2, 0]} maxBarSize={18}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={getStatusColor(entry.status)} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
