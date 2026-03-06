// =============================================================================
// ReadinessTrendChart — Recharts line chart with threshold reference lines
// =============================================================================

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';

interface TrendDataPoint {
  date: string;
  overall: number;
  equipment?: number;
  supply?: number;
  personnel?: number;
}

interface ReadinessTrendChartProps {
  data: TrendDataPoint[];
  showComponents?: boolean;
  height?: number;
}

export default function ReadinessTrendChart({
  data,
  showComponents = false,
  height = 280,
}: ReadinessTrendChartProps) {
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
            {label}
          </div>
          {payload.map((p, i) => (
            <div key={i} className="flex gap-2" style={{ color: p.color }}>
              <span className="capitalize">{p.dataKey}:</span>
              <span className="font-semibold">{p.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({
    payload,
  }: {
    payload?: Array<{ value: string; color: string }>;
  }) => {
    if (!payload) return null;
    return (
      <div
        className="flex justify-center gap-4 mt-1"
      >
        {payload.map((entry, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 font-[var(--font-mono)] text-[9px] uppercase tracking-[0.5px] text-[var(--color-text-muted)]"
          >
            <div
              className="w-[10px] h-[3px] rounded-[1px]" style={{ backgroundColor: entry.color }}
            />
            {entry.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
        <CartesianGrid
          stroke="#2a2f3e"
          strokeDasharray="3 3"
          strokeOpacity={0.5}
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fill: '#94a3b8',
          }}
          axisLine={{ stroke: '#2a2f3e' }}
          tickLine={false}
          tickFormatter={(val: string) => val.slice(5)}
        />
        <YAxis
          domain={[40, 100]}
          tick={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fill: '#94a3b8',
          }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(val: number) => `${val}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        {showComponents && <Legend content={<CustomLegend />} />}

        {/* Threshold reference lines */}
        <ReferenceLine
          y={90}
          stroke="#4ade80"
          strokeDasharray="4 4"
          strokeOpacity={0.4}
          label={{
            value: 'C-1',
            position: 'right',
            fill: '#4ade80',
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
          }}
        />
        <ReferenceLine
          y={75}
          stroke="#fbbf24"
          strokeDasharray="4 4"
          strokeOpacity={0.4}
          label={{
            value: 'C-2',
            position: 'right',
            fill: '#fbbf24',
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
          }}
        />
        <ReferenceLine
          y={60}
          stroke="#fb923c"
          strokeDasharray="4 4"
          strokeOpacity={0.4}
          label={{
            value: 'C-3',
            position: 'right',
            fill: '#fb923c',
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
          }}
        />

        {/* Overall readiness — thick blue line */}
        <Line
          type="monotone"
          dataKey="overall"
          name="Overall"
          stroke="#60a5fa"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: '#60a5fa' }}
        />

        {/* Component lines (optional) */}
        {showComponents && (
          <>
            <Line
              type="monotone"
              dataKey="equipment"
              name="Equipment"
              stroke="#4ade80"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="3 3"
            />
            <Line
              type="monotone"
              dataKey="supply"
              name="Supply"
              stroke="#fbbf24"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="3 3"
            />
            <Line
              type="monotone"
              dataKey="personnel"
              name="Personnel"
              stroke="#c084fc"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="3 3"
            />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
