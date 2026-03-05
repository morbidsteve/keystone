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
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="skeleton" style={{ width: 200, height: 16, margin: '0 auto 12px' }} />
          <div className="skeleton" style={{ width: 300, height: 12, margin: '0 auto' }} />
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}
      >
        {[
          { label: 'ACTIVE CONVOYS', value: summary.active, color: 'var(--color-text-bright)' },
          { label: 'VEHICLES ON ROAD', value: summary.totalVehicles, color: '#60a5fa' },
          { label: 'PAX MOVING', value: summary.totalPax, color: '#4ade80' },
          { label: 'DELAYED', value: summary.delayed, color: summary.delayed > 0 ? '#fb923c' : 'var(--color-text-muted)' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '1.5px',
                color: 'var(--color-text-muted)',
                marginBottom: 4,
              }}
            >
              {kpi.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 20,
                fontWeight: 700,
                color: kpi.color,
              }}
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
            style={{
              padding: 30,
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-muted)',
            }}
          >
            No active convoys at this time
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
          {activeMovements.map((mov) => {
            const isDelayed = mov.status === MovementStatus.DELAYED;
            return (
              <div
                key={mov.id}
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'var(--color-bg-elevated)',
                  border: `1px solid ${isDelayed ? 'rgba(251, 146, 60, 0.5)' : 'var(--color-border)'}`,
                  borderLeft: isDelayed ? '3px solid #fb923c' : '3px solid #4ade80',
                  borderRadius: 'var(--radius)',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--color-text-bright)',
                    }}
                  >
                    {mov.name}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 2,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      fontWeight: 700,
                      color: isDelayed ? '#fb923c' : '#4ade80',
                      backgroundColor: isDelayed ? 'rgba(251, 146, 60, 0.15)' : 'rgba(74, 222, 128, 0.15)',
                      border: `1px solid ${isDelayed ? 'rgba(251, 146, 60, 0.4)' : 'rgba(74, 222, 128, 0.4)'}`,
                    }}
                  >
                    {isDelayed && <AlertTriangle size={10} />}
                    {mov.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Route */}
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text)',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Navigation size={10} style={{ color: 'var(--color-accent)' }} />
                  {mov.originUnit} <span style={{ color: 'var(--color-text-muted)' }}>&#8594;</span> {mov.destinationUnit}
                </div>

                {/* Times */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
                      <Clock size={8} style={{ verticalAlign: 'middle', marginRight: 3 }} />DEPARTED
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text)' }}>
                      {formatDate(mov.departureTime)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
                      <Clock size={8} style={{ verticalAlign: 'middle', marginRight: 3 }} />ETA
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: isDelayed ? '#fb923c' : 'var(--color-accent)' }}>
                      {formatDate(mov.eta)}
                    </div>
                  </div>
                </div>

                {/* Vehicles/PAX */}
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                    marginBottom: 6,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Truck size={10} /> {mov.vehicles} VEH
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={10} /> {mov.personnel} PAX
                  </span>
                </div>

                {/* Notes */}
                {mov.notes && (
                  <div
                    style={{
                      marginTop: 4,
                      padding: '6px 8px',
                      backgroundColor: isDelayed ? 'rgba(251, 146, 60, 0.08)' : 'var(--color-bg-surface)',
                      borderRadius: 2,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: isDelayed ? '#fb923c' : 'var(--color-text-muted)',
                      lineHeight: 1.4,
                    }}
                  >
                    {mov.notes}
                  </div>
                )}

                {/* Coordinates */}
                {mov.originCoords && mov.destinationCoords && (
                  <div
                    style={{
                      marginTop: 6,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 8,
                      color: 'var(--color-text-muted)',
                    }}
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
