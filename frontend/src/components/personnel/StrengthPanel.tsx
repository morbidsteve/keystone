// =============================================================================
// StrengthPanel — MOS fill rates + manning trend visualization
// =============================================================================

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import type { MOSFillData, ManningSnapshotRecord } from '@/lib/types';

interface StrengthPanelProps {
  mosFill: Record<string, MOSFillData>;
  snapshots: ManningSnapshotRecord[];
}

export default function StrengthPanel({ mosFill, snapshots }: StrengthPanelProps) {
  // Build bar chart data
  const barData = useMemo(() => {
    return Object.entries(mosFill).map(([mos, data]) => ({
      mos,
      required: data.required,
      assigned: data.assigned,
      shortfall: data.shortfall,
    }));
  }, [mosFill]);

  // Summary stats
  const totalShortfall = useMemo(
    () => barData.reduce((sum, d) => sum + d.shortfall, 0),
    [barData],
  );

  const worstMOS = useMemo(() => {
    if (barData.length === 0) return null;
    return barData.reduce((worst, d) => (d.shortfall > worst.shortfall ? d : worst), barData[0]);
  }, [barData]);

  // Line chart data
  const trendData = useMemo(() => {
    return snapshots.map((s) => ({
      date: s.snapshot_date,
      fill_rate: s.fill_rate_pct,
      assigned: s.assigned_total,
      authorized: s.authorized_total,
    }));
  }, [snapshots]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            minWidth: 140,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            TOTAL SHORTFALL
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 20,
              fontWeight: 700,
              color: totalShortfall > 0 ? '#f87171' : '#4ade80',
            }}
          >
            {totalShortfall > 0 ? `-${totalShortfall}` : '0'}
          </div>
        </div>

        {worstMOS && worstMOS.shortfall > 0 && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              minWidth: 200,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '1.5px',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              WORST SHORTFALL
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 600,
                color: '#f87171',
              }}
            >
              {worstMOS.mos} ({`-${worstMOS.shortfall}`})
            </div>
          </div>
        )}
      </div>

      {/* MOS Fill Bar Chart */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '1.5px',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          MOS FILL RATES
        </div>
        <ResponsiveContainer width="100%" height={barData.length * 36 + 40}>
          <BarChart
            data={barData}
            layout="vertical"
            margin={{ top: 4, right: 30, left: 120, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#64748b', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              dataKey="mos"
              type="category"
              tick={{ fill: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              width={115}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1f2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 3,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: '#e2e8f0',
              }}
            />
            <Bar dataKey="required" fill="#475569" name="Required" barSize={14} />
            <Bar dataKey="assigned" fill="#60a5fa" name="Assigned" barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Manning Trend */}
      {trendData.length > 0 && (
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            MANNING TREND
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData} margin={{ top: 4, right: 30, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                domain={[70, 100]}
                tick={{ fill: '#64748b', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 3,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: '#e2e8f0',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Fill Rate']}
              />
              <Legend
                wrapperStyle={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: '#94a3b8',
                }}
              />
              <Line
                type="monotone"
                dataKey="fill_rate"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={{ fill: '#60a5fa', r: 4 }}
                name="Fill Rate %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
