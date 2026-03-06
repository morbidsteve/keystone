// =============================================================================
// MarchTableView — Display march table data for a convoy plan
// =============================================================================

import { ArrowLeft, Printer, Fuel, Clock, MapPin } from 'lucide-react';
import type { MarchTableData } from '@/lib/types';
import Card from '@/components/ui/Card';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MarchTableViewProps {
  marchTable: MarchTableData;
  planName: string;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarchTableView({
  marchTable,
  planName,
  onBack,
}: MarchTableViewProps) {
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const cellStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)',
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1px',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    backgroundColor: 'var(--color-bg-elevated)',
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 py-1 px-2 font-[var(--font-mono)] text-[9px] font-semibold text-[var(--color-text-muted)] bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] cursor-pointer"
          >
            <ArrowLeft size={12} /> BACK
          </button>
          <span
            className="font-[var(--font-mono)] text-sm font-bold text-[var(--color-text-bright)] tracking-[1px]"
          >
            MARCH TABLE — {planName}
          </span>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1 py-1.5 px-3 font-[var(--font-mono)] text-[9px] font-semibold text-[var(--color-text-muted)] bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] cursor-pointer"
        >
          <Printer size={12} /> PRINT
        </button>
      </div>

      {/* SP / RP prominent display */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="py-4 px-5 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] text-center" style={{ borderTop: '3px solid #4ade80' }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <MapPin size={14} className="text-[#4ade80]" />
            <span
              className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)]"
            >
              START POINT (SP)
            </span>
          </div>
          <div
            className="font-[var(--font-mono)] text-base font-bold text-[#4ade80]"
          >
            {formatDate(marchTable.sp_time)}
          </div>
        </div>
        <div
          className="py-4 px-5 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] text-center" style={{ borderTop: '3px solid #f87171' }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <MapPin size={14} className="text-[#f87171]" />
            <span
              className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)]"
            >
              RELEASE POINT (RP)
            </span>
          </div>
          <div
            className="font-[var(--font-mono)] text-base font-bold text-[#f87171]"
          >
            {formatDate(marchTable.rp_time)}
          </div>
        </div>
      </div>

      {/* Checkpoint table */}
      <Card title="CHECKPOINTS">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th style={headerCellStyle}>#</th>
                <th style={headerCellStyle}>Name</th>
                <th style={headerCellStyle}>Leg (km)</th>
                <th style={headerCellStyle}>Cumulative (km)</th>
                <th style={headerCellStyle}>ETA</th>
                <th style={headerCellStyle}>Speed (kph)</th>
              </tr>
            </thead>
            <tbody>
              {marchTable.checkpoints.map((cp, idx) => {
                const isHalt = cp.name.toUpperCase().includes('HALT');
                return (
                  <tr
                    key={idx}
                    style={{
                      backgroundColor: isHalt ? 'rgba(250, 204, 21, 0.05)' : undefined,
                    }}
                  >
                    <td style={{ ...cellStyle, color: 'var(--color-text-muted)' }}>{idx + 1}</td>
                    <td
                      style={{
                        ...cellStyle,
                        fontWeight: 600,
                        color: isHalt ? '#facc15' : 'var(--color-text-bright)',
                      }}
                    >
                      {cp.name}
                    </td>
                    <td style={cellStyle}>{cp.distance_km}</td>
                    <td style={cellStyle}>{cp.cumulative_distance_km}</td>
                    <td style={{ ...cellStyle, color: 'var(--color-accent)' }}>
                      {formatDate(cp.time)}
                    </td>
                    <td style={cellStyle}>{cp.speed_kph || '--'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary row */}
      <div className="grid gap-3 grid-cols-4">
        <div
          className="py-3.5 px-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
        >
          <div
            className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] mb-1 flex items-center gap-1"
          >
            <MapPin size={10} /> TOTAL DISTANCE
          </div>
          <div
            className="font-[var(--font-mono)] text-xl font-bold text-[var(--color-text-bright)]"
          >
            {marchTable.total_distance_km} km
          </div>
        </div>
        <div
          className="py-3.5 px-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
        >
          <div
            className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] mb-1 flex items-center gap-1"
          >
            <Clock size={10} /> TOTAL DURATION
          </div>
          <div
            className="font-[var(--font-mono)] text-xl font-bold text-[var(--color-text-bright)]"
          >
            {marchTable.total_duration_hours}h
          </div>
        </div>
        <div
          className="py-3.5 px-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
        >
          <div
            className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] mb-1"
          >
            MARCH SPEED
          </div>
          <div
            className="font-[var(--font-mono)] text-xl font-bold text-[var(--color-text-bright)]"
          >
            {marchTable.march_speed_kph} kph
          </div>
        </div>
        <div
          className="py-3.5 px-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
        >
          <div
            className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] mb-1"
          >
            CATCH-UP SPEED
          </div>
          <div
            className="font-[var(--font-mono)] text-xl font-bold text-[var(--color-text-bright)]"
          >
            {marchTable.catch_up_speed_kph} kph
          </div>
        </div>
      </div>

      {/* Fuel estimate */}
      {marchTable.fuel_estimate && (
        <Card>
          <div
            className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase mb-3 flex items-center gap-1.5"
          >
            <Fuel size={12} /> FUEL ESTIMATE
          </div>
          <div className="grid gap-4 grid-cols-3">
            <div>
              <div
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mb-0.5"
              >
                TOTAL (GAL)
              </div>
              <div
                className="font-[var(--font-mono)] text-lg font-bold text-[#fb923c]"
              >
                {marchTable.fuel_estimate.total_gallons}
              </div>
            </div>
            <div>
              <div
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mb-0.5"
              >
                TOTAL (L)
              </div>
              <div
                className="font-[var(--font-mono)] text-lg font-bold text-[#fb923c]"
              >
                {marchTable.fuel_estimate.total_liters}
              </div>
            </div>
            <div>
              <div
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mb-0.5"
              >
                PER VEHICLE (GAL)
              </div>
              <div
                className="font-[var(--font-mono)] text-lg font-bold text-[#fb923c]"
              >
                {marchTable.fuel_estimate.per_vehicle_gallons}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
