// =============================================================================
// MovementHistoryTable — Table of completed movements with analytics
// =============================================================================

import { useState, useMemo } from 'react';
import { Check, Truck, X } from 'lucide-react';
import type { MovementHistoryRecord } from '@/lib/types';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MovementHistoryTableProps {
  records: MovementHistoryRecord[];
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MovementHistoryTable({
  records,
  isLoading,
}: MovementHistoryTableProps) {
  const [onTimeOnly, setOnTimeOnly] = useState(false);

  const filteredRecords = useMemo(() => {
    if (onTimeOnly) return records.filter((r) => r.on_time);
    return records;
  }, [records, onTimeOnly]);

  const stats = useMemo(() => {
    const total = records.length;
    const onTime = records.filter((r) => r.on_time).length;
    const onTimeRate = total > 0 ? ((onTime / total) * 100).toFixed(1) : '0.0';
    const avgDuration =
      total > 0
        ? (
            records.reduce((a, r) => a + (r.duration_hours ?? 0), 0) / total
          ).toFixed(1)
        : '0.0';
    const lateMovements = records.filter((r) => !r.on_time);
    const avgDelay =
      lateMovements.length > 0
        ? (
            lateMovements.reduce((a, r) => {
              if (!r.eta || !r.actual_arrival) return a;
              const diff = (new Date(r.actual_arrival).getTime() - new Date(r.eta).getTime()) / 3600000;
              return a + Math.max(0, diff);
            }, 0) / lateMovements.length
          ).toFixed(1)
        : '0.0';
    return { total, onTimeRate, avgDuration, avgDelay };
  }, [records]);

  const formatDate = (iso: string | null) => {
    if (!iso) return '--';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const cellStyle: React.CSSProperties = {
    padding: '8px 10px',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)',
    whiteSpace: 'nowrap',
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1px',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    position: 'sticky' as const,
    top: 0,
    backgroundColor: 'var(--color-bg-elevated)',
    zIndex: 1,
  };

  if (isLoading) {
    return (
      <Card title="MOVEMENT HISTORY">
        <div className="p-10 text-center">
          <div className="skeleton w-[200px] h-[16px] mx-auto mb-3" />
          <div className="skeleton w-[300px] h-[12px] mx-auto"  />
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div
        className="grid gap-3 grid-cols-4"
      >
        {[
          { label: 'TOTAL MOVEMENTS', value: stats.total, color: 'var(--color-text-bright)' },
          {
            label: 'ON-TIME RATE',
            value: `${stats.onTimeRate}%`,
            color: parseFloat(stats.onTimeRate) >= 90 ? '#4ade80' : parseFloat(stats.onTimeRate) >= 75 ? '#facc15' : '#f87171',
          },
          { label: 'AVG DURATION', value: `${stats.avgDuration}h`, color: '#60a5fa' },
          { label: 'AVG DELAY', value: `${stats.avgDelay}h`, color: parseFloat(stats.avgDelay) > 0 ? '#fb923c' : 'var(--color-text-muted)' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="py-3.5 px-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
          >
            <div
              className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase mb-1.5"
            >
              {kpi.label}
            </div>
            <div
              className="font-[var(--font-mono)] text-[22px] font-bold" style={{ color: kpi.color }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <Card
        title="COMPLETED MOVEMENTS"
        headerRight={
          <label
            className="flex items-center gap-1.5 font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] cursor-pointer"
          >
            <input
              type="checkbox"
              checked={onTimeOnly}
              onChange={(e) => setOnTimeOnly(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            ON-TIME ONLY
          </label>
        }
      >
        {filteredRecords.length === 0 ? (
          <EmptyState
            icon={<Truck size={32} />}
            title="NO MOVEMENT RECORDS"
            message="Completed movement records will appear here"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th style={headerCellStyle}>Date</th>
                  <th style={headerCellStyle}>Convoy</th>
                  <th style={headerCellStyle}>Route</th>
                  <th style={headerCellStyle}>Vehicles</th>
                  <th style={headerCellStyle}>Planned ETA</th>
                  <th style={headerCellStyle}>Actual Arrival</th>
                  <th style={headerCellStyle}>On Time</th>
                  <th style={headerCellStyle}>Duration</th>
                  <th style={headerCellStyle}>Avg Speed</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec) => (
                  <tr key={rec.id}>
                    <td style={cellStyle}>{formatDate(rec.departure_time)}</td>
                    <td className="text-[var(--color-text-bright)]">
                      {rec.convoy_id ?? '--'}
                    </td>
                    <td style={cellStyle}>
                      <span className="text-[var(--color-text)]">{rec.origin}</span>
                      <span className="text-[var(--color-text-muted)] mx-1">&#8594;</span>
                      <span className="text-[var(--color-text)]">{rec.destination}</span>
                    </td>
                    <td style={cellStyle}>{rec.vehicle_count}</td>
                    <td style={cellStyle}>{formatDate(rec.eta)}</td>
                    <td style={cellStyle}>{formatDate(rec.actual_arrival)}</td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>
                      {rec.on_time ? (
                        <Check size={14} className="text-[#4ade80]" />
                      ) : (
                        <X size={14} className="text-[#f87171]" />
                      )}
                    </td>
                    <td style={cellStyle}>
                      {rec.duration_hours ? `${rec.duration_hours}h` : '--'}
                    </td>
                    <td style={cellStyle}>
                      {rec.average_speed_kph ? `${rec.average_speed_kph} kph` : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
