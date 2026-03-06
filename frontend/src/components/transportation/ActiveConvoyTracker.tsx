// =============================================================================
// ActiveConvoyTracker — Cards for active movements (EN_ROUTE + DELAYED)
// =============================================================================

import { useMemo } from 'react';
import { Truck, Users, Clock, AlertTriangle, Navigation } from 'lucide-react';
import type { Movement } from '@/lib/types';
import { MovementStatus } from '@/lib/types';
import Card from '@/components/ui/Card';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ActiveConvoyTrackerProps {
  movements: Movement[];
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActiveConvoyTracker({
  movements,
  isLoading,
}: ActiveConvoyTrackerProps) {
  const activeMovements = useMemo(() => {
    return movements.filter(
      (m) => m.status === MovementStatus.EN_ROUTE || m.status === MovementStatus.DELAYED,
    );
  }, [movements]);

  const summary = useMemo(() => {
    const active = activeMovements.length;
    const totalVehicles = activeMovements.reduce((a, m) => a + m.vehicles, 0);
    const totalPax = activeMovements.reduce((a, m) => a + m.personnel, 0);
    const delayed = activeMovements.filter((m) => m.status === MovementStatus.DELAYED).length;
    return { active, totalVehicles, totalPax, delayed };
  }, [activeMovements]);

  const formatTime = (iso?: string) => {
    if (!iso) return '--';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '--';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + formatTime(iso);
  };

  if (isLoading) {
    return (
      <Card title="ACTIVE CONVOYS">
        <div className="p-10 text-center">
          <div className="skeleton w-[200px] h-[16px] mx-auto mb-3" />
          <div className="skeleton w-[300px] h-[12px] mx-auto"  />
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Summary */}
      <div
        className="grid gap-3 grid-cols-4"
      >
        {[
          { label: 'ACTIVE CONVOYS', value: summary.active, color: 'var(--color-text-bright)' },
          { label: 'VEHICLES ON ROAD', value: summary.totalVehicles, color: '#60a5fa' },
          { label: 'PAX MOVING', value: summary.totalPax, color: '#4ade80' },
          { label: 'DELAYED', value: summary.delayed, color: summary.delayed > 0 ? '#fb923c' : 'var(--color-text-muted)' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="py-3 px-3.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
          >
            <div
              className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] mb-1"
            >
              {kpi.label}
            </div>
            <div
              className="font-[var(--font-mono)] text-xl font-bold" style={{ color: kpi.color }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Movement cards */}
      {activeMovements.length === 0 ? (
        <Card>
          <div
            className="p-[30px] text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
          >
            No active convoys at this time
          </div>
        </Card>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
          {activeMovements.map((mov) => {
            const isDelayed = mov.status === MovementStatus.DELAYED;
            return (
              <div
                key={mov.id}
                className="py-3.5 px-4 bg-[var(--color-bg-elevated)] rounded-[var(--radius)]" style={{ border: `1px solid ${isDelayed ? 'rgba(251, 146, 60, 0.5)' : 'var(--color-border)'}`, borderLeft: isDelayed ? '3px solid #fb923c' : '3px solid #4ade80' }}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="font-[var(--font-mono)] text-[11px] font-bold text-[var(--color-text-bright)]"
                  >
                    {mov.name}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 py-0.5 px-2 rounded-[2px] font-[var(--font-mono)] text-[9px] font-bold" style={{ color: isDelayed ? '#fb923c' : '#4ade80', backgroundColor: isDelayed ? 'rgba(251, 146, 60, 0.15)' : 'rgba(74, 222, 128, 0.15)', border: `1px solid ${isDelayed ? 'rgba(251, 146, 60, 0.4)' : 'rgba(74, 222, 128, 0.4)'}` }}
                  >
                    {isDelayed && <AlertTriangle size={10} />}
                    {mov.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Route */}
                <div
                  className="font-[var(--font-mono)] text-[10px] text-[var(--color-text)] mb-2 flex items-center gap-1.5"
                >
                  <Navigation size={10} className="text-[var(--color-accent)]" />
                  {mov.originUnit} <span className="text-[var(--color-text-muted)]">&#8594;</span> {mov.destinationUnit}
                </div>

                {/* Times */}
                <div
                  className="grid gap-1.5 mb-2 grid-cols-2"
                >
                  <div>
                    <div className="font-[var(--font-mono)] text-[8px] text-[var(--color-text-muted)] tracking-[0.5px]">
                      <Clock size={8} className="align-middle mr-[3px]" />DEPARTED
                    </div>
                    <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text)]">
                      {formatDate(mov.departureTime)}
                    </div>
                  </div>
                  <div>
                    <div className="font-[var(--font-mono)] text-[8px] text-[var(--color-text-muted)] tracking-[0.5px]">
                      <Clock size={8} className="align-middle mr-[3px]" />ETA
                    </div>
                    <div className="font-[var(--font-mono)] text-[10px]" style={{ color: isDelayed ? '#fb923c' : 'var(--color-accent)' }}>
                      {formatDate(mov.eta)}
                    </div>
                  </div>
                </div>

                {/* Vehicles/PAX */}
                <div
                  className="flex gap-4 font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mb-1.5"
                >
                  <span className="flex items-center gap-1">
                    <Truck size={10} /> {mov.vehicles} VEH
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={10} /> {mov.personnel} PAX
                  </span>
                </div>

                {/* Notes */}
                {mov.notes && (
                  <div
                    className="mt-1 py-1.5 px-2 rounded-[2px] font-[var(--font-mono)] text-[9px] leading-[1.4]" style={{ backgroundColor: isDelayed ? 'rgba(251, 146, 60, 0.08)' : 'var(--color-bg-surface)', color: isDelayed ? '#fb923c' : 'var(--color-text-muted)' }}
                  >
                    {mov.notes}
                  </div>
                )}

                {/* Coordinates */}
                {mov.originCoords && mov.destinationCoords && (
                  <div
                    className="mt-1.5 font-[var(--font-mono)] text-[8px] text-[var(--color-text-muted)]"
                  >
                    {mov.originCoords.lat.toFixed(2)}, {mov.originCoords.lon.toFixed(2)} &#8594;{' '}
                    {mov.destinationCoords.lat.toFixed(2)}, {mov.destinationCoords.lon.toFixed(2)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
