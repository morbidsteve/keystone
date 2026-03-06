// =============================================================================
// FuelForecastChart — Recharts LineChart: fuel depletion projection
// =============================================================================

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingDown, AlertTriangle } from 'lucide-react';
import type { FuelForecast } from '@/lib/types';

interface FuelForecastChartProps {
  forecast: FuelForecast;
}

export default function FuelForecastChart({ forecast }: FuelForecastChartProps) {
  const projectionData = useMemo(() => {
    const data: Array<{
      day: number;
      gallons: number;
      dos: number;
    }> = [];

    const dailyBurn = forecast.projected_daily_consumption_gallons;
    const startGallons = forecast.current_on_hand_gallons;

    for (let day = 0; day <= 14; day++) {
      const remaining = Math.max(0, startGallons - dailyBurn * day);
      const dosRemaining = dailyBurn > 0 ? remaining / dailyBurn : 0;
      data.push({
        day,
        gallons: Math.round(remaining),
        dos: Math.round(dosRemaining * 10) / 10,
      });
    }

    return data;
  }, [forecast]);

  const daysUntilResupply = useMemo(() => {
    const resupplyDate = new Date(forecast.resupply_required_by_date);
    const now = new Date();
    const diff = (resupplyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.round(diff * 10) / 10);
  }, [forecast]);

  const tempoColors: Record<string, string> = {
    LOW: '#22c55e',
    MEDIUM: '#3b82f6',
    HIGH: '#f59e0b',
    SURGE: '#ef4444',
  };

  const tempoColor = tempoColors[forecast.operational_tempo] ?? '#3b82f6';

  return (
    <div>
      {/* Summary cards */}
      <div
        className="grid gap-2.5 mb-4 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]"
      >
        {[
          {
            label: 'OP TEMPO',
            value: forecast.operational_tempo,
            color: tempoColor,
          },
          {
            label: 'DAILY BURN',
            value: `${forecast.projected_daily_consumption_gallons.toLocaleString()} gal`,
            color: 'var(--color-text-bright)',
          },
          {
            label: 'CURRENT DOS',
            value: forecast.days_of_supply.toFixed(1),
            color: forecast.days_of_supply <= 3 ? '#ef4444' : forecast.days_of_supply <= 5 ? '#f59e0b' : '#22c55e',
          },
          {
            label: 'RESUPPLY IN',
            value: `${daysUntilResupply} days`,
            color: daysUntilResupply <= 2 ? '#ef4444' : daysUntilResupply <= 4 ? '#f59e0b' : '#22c55e',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="py-2.5 px-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)]"
          >
            <div
              className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] mb-1"
            >
              {item.label}
            </div>
            <div
              className="font-[var(--font-mono)] text-base font-bold" style={{ color: item.color }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      {forecast.alert && (
        <div
          className="flex items-center gap-2 py-2 px-3 bg-[rgba(239,68,68,0.1)] rounded-[var(--radius)] mb-3 border border-[rgba(239,68,68,0.3)]"
        >
          <AlertTriangle size={14} className="text-[#ef4444]" />
          <span
            className="font-[var(--font-mono)] text-[10px] text-[#ef4444] font-semibold"
          >
            CRITICAL: {forecast.days_of_supply.toFixed(1)} DOS remaining. Resupply required NLT{' '}
            {forecast.resupply_required_by_date}.
          </span>
        </div>
      )}

      {/* Chart header */}
      <div
        className="flex items-center gap-1.5 mb-3"
      >
        <TrendingDown size={12} className="text-[var(--color-text-muted)]" />
        <span
          className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)]"
        >
          14-DAY FUEL PROJECTION
        </span>
      </div>

      {/* Chart */}
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={projectionData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              opacity={0.5}
            />
            <XAxis
              dataKey="day"
              label={{ value: 'Days', position: 'insideBottom', offset: -2, style: { fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-text-muted)' } }}
              tick={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--color-text-muted)' }}
              stroke="var(--color-border)"
            />
            <YAxis
              yAxisId="gallons"
              label={{ value: 'Gallons', angle: -90, position: 'insideLeft', style: { fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-text-muted)' } }}
              tick={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--color-text-muted)' }}
              stroke="var(--color-border)"
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="dos"
              orientation="right"
              label={{ value: 'DOS', angle: 90, position: 'insideRight', style: { fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-text-muted)' } }}
              tick={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--color-text-muted)' }}
              stroke="var(--color-border)"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
              }}
              formatter={(value: number, name: string) => {
                if (name === 'Fuel On Hand (gal)') return [value.toLocaleString() + ' gal', name];
                return [value.toFixed(1) + ' days', name];
              }}
              labelFormatter={(label: number) => `Day ${label}`}
            />
            <Legend
              wrapperStyle={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
              }}
            />
            <ReferenceLine
              yAxisId="dos"
              y={3}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{
                value: '3 DOS',
                position: 'right',
                style: { fontFamily: 'var(--font-mono)', fontSize: 9, fill: '#ef4444' },
              }}
            />
            <Line
              yAxisId="gallons"
              type="monotone"
              dataKey="gallons"
              name="Fuel On Hand (gal)"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="dos"
              type="monotone"
              dataKey="dos"
              name="Days of Supply"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
