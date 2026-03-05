// =============================================================================
// EquipmentReliabilityChart — Grouped bar chart: corrective vs preventive WOs
// =============================================================================

import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { getEquipmentReliability } from '@/api/maintenanceAnalytics';

interface EquipmentReliabilityChartProps {
  unitId: number;
  days?: number;
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
  if (!active || !payload?.length) return null;
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
      <div style={{ color: 'var(--color-text-bright)', marginBottom: 4, fontWeight: 600 }}>
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span>{p.dataKey === 'corrective_count' ? 'CORRECTIVE' : 'PREVENTIVE'}</span>
          <span>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function EquipmentReliabilityChart({ unitId, days = 90 }: EquipmentReliabilityChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['equipment-reliability', unitId, days],
    queryFn: () => getEquipmentReliability(unitId, days),
  });

  if (isLoading) {
    return <div className="skeleton" style={{ width: '100%', height: 300 }} />;
  }

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-muted)',
        }}
      >
        No equipment reliability data available
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <CartesianGrid
            stroke="var(--color-border)"
            strokeDasharray="3 3"
            strokeOpacity={0.4}
            vertical={false}
          />
          <XAxis
            dataKey="equipment_type"
            tick={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fill: 'var(--color-text-muted)',
            }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fill: 'var(--color-text-muted)',
            }}
            axisLine={false}
            tickLine={false}
            label={{
              value: 'Work Orders',
              angle: -90,
              position: 'insideLeft',
              style: {
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fill: 'var(--color-text-muted)',
              },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.5px',
            }}
          />
          <Bar
            dataKey="corrective_count"
            name="CORRECTIVE"
            fill="#ef4444"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="preventive_count"
            name="PREVENTIVE"
            fill="#10b981"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
