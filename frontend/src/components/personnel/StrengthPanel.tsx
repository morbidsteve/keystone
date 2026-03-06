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
    <div className="flex flex-col gap-5">
      {/* Summary stats */}
      <div className="flex gap-4 flex-wrap">
        <div
          className="py-3 px-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] min-w-[140px]"
        >
          <div
            className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase mb-1"
          >
            TOTAL SHORTFALL
          </div>
          <div
            className="font-[var(--font-mono)] text-xl font-bold" style={{ color: totalShortfall > 0 ? '#f87171' : '#4ade80' }}
          >
            {totalShortfall > 0 ? `-${totalShortfall}` : '0'}
          </div>
        </div>

        {worstMOS && worstMOS.shortfall > 0 && (
          <div
            className="py-3 px-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] min-w-[200px]"
          >
            <div
              className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase mb-1"
            >
              WORST SHORTFALL
            </div>
            <div
              className="font-[var(--font-mono)] text-xs font-semibold text-[#f87171]"
            >
              {worstMOS.mos} ({`-${worstMOS.shortfall}`})
            </div>
          </div>
        )}
      </div>

      {/* MOS Fill Bar Chart */}
      <div>
        <div
          className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase mb-3"
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
            className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase mb-3"
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
