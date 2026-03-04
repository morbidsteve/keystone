import { useState } from 'react';
import { Truck, MapPin, Clock, ArrowRight, ChevronDown, Package } from 'lucide-react';
import Card from '@/components/ui/Card';
import StatusDot from '@/components/ui/StatusDot';
import { MovementStatus, type Movement } from '@/lib/types';
import { formatDateShort } from '@/lib/utils';

interface MovementTrackerProps {
  movements?: Movement[];
  selectedConvoyId?: string | null;
  onSelectConvoy?: (id: string) => void;
}

const fallbackMovements: Movement[] = [
  { id: '1', name: 'CONVOY ALPHA', originUnit: 'CLB-1', destinationUnit: '1/1 BN', status: MovementStatus.EN_ROUTE, cargo: 'CL III (8,000 gal JP-8), CL V (5.56mm, 7.62mm)', priority: 'PRIORITY', departureTime: '2026-03-03T06:00:00Z', eta: '2026-03-03T16:00:00Z', vehicles: 8, personnel: 16, lastUpdated: '2026-03-03T08:00:00Z' },
  { id: '2', name: 'CONVOY BRAVO', originUnit: 'CLB-1', destinationUnit: '2/1 BN', status: MovementStatus.PLANNED, cargo: 'CL IX (HMMWV Parts Kits x12)', priority: 'ROUTINE', departureTime: '2026-03-04T06:00:00Z', vehicles: 4, personnel: 8, lastUpdated: '2026-03-03T07:00:00Z' },
  { id: '3', name: 'CONVOY CHARLIE', originUnit: 'CSSB-1', destinationUnit: '3/1 BN', status: MovementStatus.DELAYED, cargo: 'CL I (MRE x200 cases), CL III (4,000 gal)', priority: 'URGENT', departureTime: '2026-03-03T04:00:00Z', eta: '2026-03-03T20:00:00Z', vehicles: 6, personnel: 12, notes: 'Delayed - MSR BRAVO bridge restriction', lastUpdated: '2026-03-03T09:00:00Z' },
  { id: '4', name: 'MEDEVAC FOXTROT', originUnit: '3/1 BN', destinationUnit: 'ROLE 2', status: MovementStatus.ARRIVED, cargo: 'CL VIII (Emergency Medical)', priority: 'URGENT', departureTime: '2026-03-03T02:00:00Z', arrivalTime: '2026-03-03T04:30:00Z', vehicles: 2, personnel: 4, lastUpdated: '2026-03-03T04:30:00Z' },
];

function getMovementStatusColor(status: MovementStatus) {
  switch (status) {
    case MovementStatus.EN_ROUTE: return 'var(--color-accent)';
    case MovementStatus.ARRIVED: return 'var(--color-success)';
    case MovementStatus.DELAYED: return 'var(--color-danger)';
    case MovementStatus.PLANNED: return 'var(--color-text-muted)';
    case MovementStatus.CANCELLED: return 'var(--color-muted)';
  }
}

function getMovementDotStatus(status: MovementStatus) {
  switch (status) {
    case MovementStatus.EN_ROUTE: return 'AMBER';
    case MovementStatus.ARRIVED: return 'GREEN';
    case MovementStatus.DELAYED: return 'RED';
    default: return 'AMBER';
  }
}

export default function MovementTracker({
  movements,
  selectedConvoyId,
  onSelectConvoy,
}: MovementTrackerProps) {
  const [expandedManifest, setExpandedManifest] = useState<string | null>(null);
  const displayMovements = movements && movements.length > 0 ? movements : fallbackMovements;

  return (
    <Card title="ACTIVE MOVEMENTS">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {displayMovements.map((mov) => {
          const statusColor = getMovementStatusColor(mov.status);
          const isSelected = mov.id === selectedConvoyId;
          return (
            <div
              key={mov.id}
              onClick={() => onSelectConvoy?.(mov.id)}
              style={{
                padding: '12px 14px',
                backgroundColor: isSelected
                  ? 'rgba(77, 171, 247, 0.05)'
                  : 'var(--color-bg-surface)',
                border: isSelected
                  ? '1px solid var(--color-accent)'
                  : '1px solid var(--color-border)',
                borderLeft: `3px solid ${statusColor}`,
                borderRadius: 'var(--radius)',
                transition: 'background-color var(--transition)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isSelected
                  ? 'rgba(77, 171, 247, 0.05)'
                  : 'var(--color-bg-surface)';
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Truck size={14} style={{ color: statusColor }} />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--color-text-bright)',
                    }}
                  >
                    {mov.name}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: mov.priority === 'URGENT' ? 'var(--color-danger)' : 'var(--color-text-muted)',
                      fontWeight: 600,
                      letterSpacing: '1px',
                    }}
                  >
                    {mov.priority}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusDot
                    status={getMovementDotStatus(mov.status)}
                    pulse={mov.status === MovementStatus.EN_ROUTE}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: statusColor,
                      fontWeight: 600,
                      letterSpacing: '1px',
                    }}
                  >
                    {mov.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Route */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 6,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                }}
              >
                <MapPin size={12} style={{ color: 'var(--color-text-muted)' }} />
                <span style={{ color: 'var(--color-text)' }}>{mov.originUnit}</span>
                <ArrowRight size={12} style={{ color: 'var(--color-text-muted)' }} />
                <span style={{ color: 'var(--color-text-bright)' }}>{mov.destinationUnit}</span>
              </div>

              {/* Cargo */}
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                {mov.manifest ? (
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {mov.manifest.cargo.map((c, i) => (
                        <span key={i} style={{
                          padding: '1px 6px',
                          backgroundColor: 'rgba(77, 171, 247, 0.08)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius)',
                          fontSize: 10,
                          fontFamily: 'var(--font-mono)',
                        }}>
                          CL {c.supplyClass}: {c.quantity} {c.unit}
                        </span>
                      ))}
                    </div>
                    {mov.manifest.vehicles.length > 0 && (
                      <div style={{ marginTop: 4, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                        {mov.manifest.vehicles.map(v => `${v.quantity}x ${v.type}`).join(', ')}
                      </div>
                    )}
                  </div>
                ) : (
                  mov.cargo
                )}
              </div>

              {/* Manifest expand toggle */}
              {mov.manifest && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedManifest(prev => prev === mov.id ? null : mov.id);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '2px 0', marginBottom: 4,
                    fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
                    letterSpacing: '0.5px',
                    color: 'var(--color-accent)',
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  <Package size={10} />
                  {expandedManifest === mov.id ? 'HIDE MANIFEST' : 'VIEW MANIFEST'}
                  <ChevronDown size={10} style={{
                    transform: expandedManifest === mov.id ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                  }} />
                </button>
              )}

              {/* Expanded manifest detail */}
              {mov.manifest && expandedManifest === mov.id && (
                <div style={{
                  padding: 8,
                  marginBottom: 6,
                  backgroundColor: 'rgba(77, 171, 247, 0.03)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                }}>
                  {/* Cargo table */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', color: 'var(--color-text-muted)', marginBottom: 4 }}>CARGO</div>
                    {mov.manifest.cargo.map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <span style={{ color: 'var(--color-text)' }}>CL {c.supplyClass} — {c.description}</span>
                        <span style={{ color: 'var(--color-text-bright)', fontWeight: 600 }}>{c.quantity} {c.unit}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontWeight: 700, color: 'var(--color-text-bright)' }}>
                      <span>TOTAL WEIGHT</span>
                      <span>{mov.manifest.totalWeightTons} T</span>
                    </div>
                  </div>

                  {/* Vehicle table */}
                  {mov.manifest.vehicles.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', color: 'var(--color-text-muted)', marginBottom: 4 }}>VEHICLES</div>
                      {mov.manifest.vehicles.map((v, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid var(--color-border)' }}>
                          <span style={{ color: 'var(--color-text)' }}>{v.type} ({v.tamcn})</span>
                          <span style={{ color: 'var(--color-text-bright)', fontWeight: 600 }}>{v.quantity}x</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontWeight: 700, color: 'var(--color-text-bright)' }}>
                        <span>TOTAL</span>
                        <span>{mov.manifest.totalVehicles} VEH</span>
                      </div>
                    </div>
                  )}

                  {/* Personnel table */}
                  {mov.manifest.personnelByRole.length > 0 && (
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', color: 'var(--color-text-muted)', marginBottom: 4 }}>PERSONNEL</div>
                      {mov.manifest.personnelByRole.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid var(--color-border)' }}>
                          <span style={{ color: 'var(--color-text)' }}>{p.role}</span>
                          <span style={{ color: 'var(--color-text-bright)', fontWeight: 600 }}>{p.count}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontWeight: 700, color: 'var(--color-text-bright)' }}>
                        <span>TOTAL</span>
                        <span>{mov.manifest.totalPersonnel} PAX</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Details Footer */}
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  paddingTop: 6,
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                <span>{mov.vehicles} VEH / {mov.personnel} PAX</span>
                {mov.departureTime && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={9} />
                    DEP: {formatDateShort(mov.departureTime)}
                  </span>
                )}
                {mov.eta && (
                  <span>ETA: {formatDateShort(mov.eta)}</span>
                )}
                {mov.arrivalTime && (
                  <span style={{ color: 'var(--color-success)' }}>
                    ARR: {formatDateShort(mov.arrivalTime)}
                  </span>
                )}
              </div>

              {/* Notes */}
              {mov.notes && (
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--color-warning)',
                    marginTop: 6,
                    padding: '4px 8px',
                    backgroundColor: 'rgba(250, 176, 5, 0.08)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  {mov.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
