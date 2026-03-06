import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import Card from '@/components/ui/Card';

interface ThroughputPoint {
  date: string;
  tonnage: number;
  convoys: number;
}

const demoData: ThroughputPoint[] = [
  { date: '02/25', tonnage: 42, convoys: 3 },
  { date: '02/26', tonnage: 38, convoys: 2 },
  { date: '02/27', tonnage: 55, convoys: 4 },
  { date: '02/28', tonnage: 48, convoys: 3 },
  { date: '03/01', tonnage: 62, convoys: 5 },
  { date: '03/02', tonnage: 35, convoys: 2 },
  { date: '03/03', tonnage: 44, convoys: 3 },
];

export default function ThroughputChart() {
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)] rounded-[var(--radius)] py-2 px-3 font-[var(--font-mono)] text-[11px]"
        >
          <div className="text-[var(--color-text-muted)] mb-1">{label}</div>
          {payload.map((p, i) => (
            <div key={i} style={{ color: p.dataKey === 'tonnage' ? 'var(--color-accent)' : 'var(--color-success)' }}>
              {p.dataKey === 'tonnage' ? 'Tonnage' : 'Convoys'}: {p.value}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card title="THROUGHPUT (7D)">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={demoData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <CartesianGrid
            stroke="var(--color-border)"
            strokeDasharray="3 3"
            strokeOpacity={0.4}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-text-muted)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="tonnage" fill="var(--color-accent)" fillOpacity={0.7} radius={[2, 2, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
      {/* Summary */}
      <div
        className="flex gap-6 justify-center mt-3 pt-3 border-t border-t-[var(--color-border)]"
      >
        <div className="text-center">
          <div className="section-header mb-1">TOTAL TONNAGE</div>
          <div className="font-[var(--font-mono)] text-xl font-bold text-[var(--color-accent)]">
            {demoData.reduce((s, d) => s + d.tonnage, 0)}T
          </div>
        </div>
        <div className="text-center">
          <div className="section-header mb-1">TOTAL CONVOYS</div>
          <div className="font-[var(--font-mono)] text-xl font-bold text-[var(--color-success)]">
            {demoData.reduce((s, d) => s + d.convoys, 0)}
          </div>
        </div>
        <div className="text-center">
          <div className="section-header mb-1">AVG/DAY</div>
          <div className="font-[var(--font-mono)] text-xl font-bold text-[var(--color-text)]">
            {Math.round(demoData.reduce((s, d) => s + d.tonnage, 0) / demoData.length)}T
          </div>
        </div>
      </div>
    </Card>
  );
}
