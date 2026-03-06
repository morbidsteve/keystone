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
  onViewDetail?: (movement: Movement) => void;
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
  onViewDetail,
}: MovementTrackerProps) {
  const [expandedManifest, setExpandedManifest] = useState<string | null>(null);
  const displayMovements = movements && movements.length > 0 ? movements : fallbackMovements;

  return (
    <Card title="ACTIVE MOVEMENTS">
      <div className="flex flex-col gap-2">
        {displayMovements.map((mov) => {
          const statusColor = getMovementStatusColor(mov.status);
          const isSelected = mov.id === selectedConvoyId;
          return (
            <div
              key={mov.id}
              onClick={() => {
                onSelectConvoy?.(mov.id);
                onViewDetail?.(mov);
              }}
              className="py-3 px-3.5 rounded-[var(--radius)] cursor-pointer" style={{ backgroundColor: isSelected
                  ? 'rgba(77, 171, 247, 0.05)'
                  : 'var(--color-bg-surface)', border: isSelected
                  ? '1px solid var(--color-accent)'
                  : '1px solid var(--color-border)', borderLeft: `3px solid ${statusColor}`, transition: 'background-color var(--transition)' }}
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
                className="flex justify-between items-center mb-2"
              >
                <div className="flex items-center gap-2">
                  <Truck size={14} style={{ color: statusColor }} />
                  <span
                    className="font-[var(--font-mono)] text-[13px] font-bold text-[var(--color-text-bright)]"
                  >
                    {mov.name}
                  </span>
                  <span
                    className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px]" style={{ color: mov.priority === 'URGENT' ? 'var(--color-danger)' : 'var(--color-text-muted)' }}
                  >
                    {mov.priority}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusDot
                    status={getMovementDotStatus(mov.status)}
                    pulse={mov.status === MovementStatus.EN_ROUTE}
                  />
                  <span
                    className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px]" style={{ color: statusColor }}
                  >
                    {mov.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Route */}
              <div
                className="flex items-center gap-2 mb-1.5 font-[var(--font-mono)] text-[11px]"
              >
                <MapPin size={12} className="text-[var(--color-text-muted)]" />
                <span className="text-[var(--color-text)]">{mov.originUnit}</span>
                <ArrowRight size={12} className="text-[var(--color-text-muted)]" />
                <span className="text-[var(--color-text-bright)]">{mov.destinationUnit}</span>
              </div>

              {/* Cargo */}
              <div className="text-[11px] text-[var(--color-text-muted)] mb-1.5">
                {mov.manifest ? (
                  <div>
                    <div className="flex flex-wrap gap-1.5">
                      {mov.manifest.cargo.map((c, i) => (
                        <span key={i} className="py-px px-1.5 bg-[rgba(77,171,247,0.08)] border border-[var(--color-border)] rounded-[var(--radius)] text-[10px] font-[var(--font-mono)]">
                          CL {c.supplyClass}: {c.quantity} {c.unit}
                        </span>
                      ))}
                    </div>
                    {mov.manifest.vehicles.length > 0 && (
                      <div className="mt-1 text-[10px] font-[var(--font-mono)]">
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
                  className="flex items-center gap-1 py-0.5 px-0 mb-1 font-[var(--font-mono)] text-[9px] font-semibold tracking-[0.5px] text-[var(--color-accent)] bg-transparent border-0 cursor-pointer"
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
                <div className="p-2 mb-1.5 bg-[rgba(77,171,247,0.03)] border border-[var(--color-border)] rounded-[var(--radius)] text-[10px] font-[var(--font-mono)]">
                  {/* Cargo table */}
                  <div className="mb-2">
                    <div className="text-[9px] font-bold tracking-[1px] text-[var(--color-text-muted)] mb-1">CARGO</div>
                    {mov.manifest.cargo.map((c, i) => (
                      <div key={i} className="flex justify-between py-0.5 px-0 border-b border-b-[var(--color-border)]">
                        <span className="text-[var(--color-text)]">CL {c.supplyClass} — {c.description}</span>
                        <span className="text-[var(--color-text-bright)] font-semibold">{c.quantity} {c.unit}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-0.5 px-0 font-bold text-[var(--color-text-bright)]">
                      <span>TOTAL WEIGHT</span>
                      <span>{mov.manifest.totalWeightTons} T</span>
                    </div>
                  </div>

                  {/* Vehicle table */}
                  {mov.manifest.vehicles.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[9px] font-bold tracking-[1px] text-[var(--color-text-muted)] mb-1">VEHICLES</div>
                      {mov.manifest.vehicles.map((v, i) => (
                        <div key={i} className="flex justify-between py-0.5 px-0 border-b border-b-[var(--color-border)]">
                          <span className="text-[var(--color-text)]">{v.type} ({v.tamcn})</span>
                          <span className="text-[var(--color-text-bright)] font-semibold">{v.quantity}x</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-0.5 px-0 font-bold text-[var(--color-text-bright)]">
                        <span>TOTAL</span>
                        <span>{mov.manifest.totalVehicles} VEH</span>
                      </div>
                    </div>
                  )}

                  {/* Personnel table */}
                  {mov.manifest.personnelByRole.length > 0 && (
                    <div>
                      <div className="text-[9px] font-bold tracking-[1px] text-[var(--color-text-muted)] mb-1">PERSONNEL</div>
                      {mov.manifest.personnelByRole.map((p, i) => (
                        <div key={i} className="flex justify-between py-0.5 px-0 border-b border-b-[var(--color-border)]">
                          <span className="text-[var(--color-text)]">{p.role}</span>
                          <span className="text-[var(--color-text-bright)] font-semibold">{p.count}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-0.5 px-0 font-bold text-[var(--color-text-bright)]">
                        <span>TOTAL</span>
                        <span>{mov.manifest.totalPersonnel} PAX</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Details Footer */}
              <div
                className="flex gap-4 font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] pt-1.5 border-t border-t-[var(--color-border)]"
              >
                <span>{mov.vehicles} VEH / {mov.personnel} PAX</span>
                {mov.departureTime && (
                  <span className="flex items-center gap-[3px]">
                    <Clock size={9} />
                    DEP: {formatDateShort(mov.departureTime)}
                  </span>
                )}
                {mov.eta && (
                  <span>ETA: {formatDateShort(mov.eta)}</span>
                )}
                {mov.arrivalTime && (
                  <span className="text-[var(--color-success)]">
                    ARR: {formatDateShort(mov.arrivalTime)}
                  </span>
                )}
              </div>

              {/* Notes */}
              {mov.notes && (
                <div
                  className="text-[10px] text-[var(--color-warning)] mt-1.5 py-1 px-2 bg-[rgba(250,176,5,0.08)] rounded-[var(--radius)]"
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
