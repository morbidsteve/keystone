import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import Card from '@/components/ui/Card';

interface TrendPoint {
  date: string;
  hmmwv: number;
  mtvr: number;
  lav: number;
  aav: number;
}

const demoData: TrendPoint[] = [
  { date: '02/25', hmmwv: 89, mtvr: 82, lav: 95, aav: 75 },
  { date: '02/26', hmmwv: 87, mtvr: 80, lav: 94, aav: 72 },
  { date: '02/27', hmmwv: 85, mtvr: 78, lav: 92, aav: 70 },
  { date: '02/28', hmmwv: 88, mtvr: 76, lav: 93, aav: 68 },
  { date: '03/01', hmmwv: 87, mtvr: 74, lav: 94, aav: 67 },
  { date: '03/02', hmmwv: 86, mtvr: 75, lav: 92, aav: 67 },
  { date: '03/03', hmmwv: 87, mtvr: 75, lav: 94, aav: 67 },
];

export default function ReadinessTrend() {
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
          <div style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
          {payload.map((p, i) => (
            <div key={i} style={{ color: p.color }}>
              {p.dataKey.toUpperCase()}: {p.value}%
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card title="READINESS TREND (7D)">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={demoData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <CartesianGrid
            stroke="var(--color-border)"
            strokeDasharray="3 3"
            strokeOpacity={0.4}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--color-text-muted)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            domain={[50, 100]}
            tick={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--color-text-muted)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val: number) => `${val}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={90} stroke="var(--color-success)" strokeDasharray="3 3" strokeOpacity={0.4} />
          <ReferenceLine y={75} stroke="var(--color-warning)" strokeDasharray="3 3" strokeOpacity={0.4} />
          <Line type="monotone" dataKey="hmmwv" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="mtvr" stroke="var(--color-warning)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="lav" stroke="var(--color-success)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="aav" stroke="var(--color-danger)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
        {[
          { key: 'HMMWV', color: 'var(--color-accent)' },
          { key: 'MTVR', color: 'var(--color-warning)' },
          { key: 'LAV', color: 'var(--color-success)' },
          { key: 'AAV', color: 'var(--color-danger)' },
        ].map((item) => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 2, backgroundColor: item.color }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
              {item.key}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
