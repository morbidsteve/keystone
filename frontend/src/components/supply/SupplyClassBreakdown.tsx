import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import Card from '@/components/ui/Card';
import { SupplyStatus } from '@/lib/types';
import { getStatusColor } from '@/lib/utils';

interface BreakdownItem {
  unit: string;
  percentage: number;
  onHand: number;
  authorized: number;
  status: SupplyStatus;
}

interface SupplyClassBreakdownProps {
  className?: string;
  data?: BreakdownItem[];
}

const demoData: BreakdownItem[] = [
  { unit: '1/1 BN', percentage: 85, onHand: 8500, authorized: 10000, status: SupplyStatus.GREEN },
  { unit: '2/1 BN', percentage: 62, onHand: 6200, authorized: 10000, status: SupplyStatus.AMBER },
  { unit: '3/1 BN', percentage: 45, onHand: 4500, authorized: 10000, status: SupplyStatus.RED },
  { unit: 'CLB-1', percentage: 92, onHand: 9200, authorized: 10000, status: SupplyStatus.GREEN },
  { unit: 'H&S BN', percentage: 78, onHand: 7800, authorized: 10000, status: SupplyStatus.AMBER },
];

export default function SupplyClassBreakdown({ className, data }: SupplyClassBreakdownProps) {
  const chartData = data || demoData;

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: BreakdownItem }> }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div
          className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)] rounded-[var(--radius)] py-2 px-3 font-[var(--font-mono)] text-[11px]"
        >
          <div className="text-[var(--color-text-bright)] mb-1">
            {d.unit}
          </div>
          <div className="text-[var(--color-text-muted)]">
            {d.onHand.toLocaleString()} / {d.authorized.toLocaleString()} ({d.percentage}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card title={`${className || 'SUPPLY CLASS'} BY UNIT`}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ left: 0, right: 10 }}>
          <XAxis
            dataKey="unit"
            tick={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fill: 'var(--color-text-muted)',
            }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fill: 'var(--color-text-muted)',
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val: number) => `${val}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="percentage" radius={[2, 2, 0, 0]} maxBarSize={40}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={getStatusColor(entry.status)} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
