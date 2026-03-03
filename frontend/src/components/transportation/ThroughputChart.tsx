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
        style={{
          display: 'flex',
          gap: 24,
          justifyContent: 'center',
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="section-header" style={{ marginBottom: 4 }}>TOTAL TONNAGE</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--color-accent)' }}>
            {demoData.reduce((s, d) => s + d.tonnage, 0)}T
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="section-header" style={{ marginBottom: 4 }}>TOTAL CONVOYS</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--color-success)' }}>
            {demoData.reduce((s, d) => s + d.convoys, 0)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="section-header" style={{ marginBottom: 4 }}>AVG/DAY</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--color-text)' }}>
            {Math.round(demoData.reduce((s, d) => s + d.tonnage, 0) / demoData.length)}T
          </div>
        </div>
      </div>
    </Card>
  );
}
