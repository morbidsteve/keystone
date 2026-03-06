// =============================================================================
// LiftRequestBoard — Column-based display of lift requests by status
// =============================================================================

import { useState, useMemo } from 'react';
import { Plus, Package, Users, Truck, AlertTriangle, Boxes } from 'lucide-react';
import type { LiftRequest, LiftRequestPriority, LiftRequestStatus, CargoType } from '@/lib/types';
import Card from '@/components/ui/Card';

// ---------------------------------------------------------------------------
// Priority / Cargo type helpers
// ---------------------------------------------------------------------------

const PRIORITY_COLORS: Record<LiftRequestPriority, { bg: string; text: string; border: string }> = {
  ROUTINE: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.4)' },
  PRIORITY: { bg: 'rgba(250, 204, 21, 0.15)', text: '#facc15', border: 'rgba(250, 204, 21, 0.4)' },
  EMERGENCY: { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171', border: 'rgba(248, 113, 113, 0.4)' },
};

function CargoIcon({ type }: { type: CargoType }) {
  const iconStyle = { color: 'var(--color-text-muted)' };
  switch (type) {
    case 'PERSONNEL': return <Users size={12} style={iconStyle} />;
    case 'EQUIPMENT': return <Truck size={12} style={iconStyle} />;
    case 'SUPPLY': return <Package size={12} style={iconStyle} />;
    case 'MIXED': return <Boxes size={12} style={iconStyle} />;
    default: return <Package size={12} style={iconStyle} />;
  }
}

// ---------------------------------------------------------------------------
// Column statuses to display
// ---------------------------------------------------------------------------

const DISPLAY_COLUMNS: { status: LiftRequestStatus; label: string; accentColor: string }[] = [
  { status: 'REQUESTED', label: 'REQUESTED', accentColor: '#94a3b8' },
  { status: 'APPROVED', label: 'APPROVED', accentColor: '#60a5fa' },
  { status: 'SCHEDULED', label: 'SCHEDULED', accentColor: '#a78bfa' },
  { status: 'IN_TRANSIT', label: 'IN TRANSIT', accentColor: '#4ade80' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LiftRequestBoardProps {
  requests: LiftRequest[];
  isLoading: boolean;
  onCreateRequest: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LiftRequestBoard({
  requests,
  isLoading,
  onCreateRequest,
}: LiftRequestBoardProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === 'REQUESTED' || r.status === 'APPROVED').length;
    const inTransit = requests.filter((r) => r.status === 'IN_TRANSIT').length;
    const deliveredThisMonth = requests.filter((r) => {
      if (r.status !== 'DELIVERED') return false;
      const d = new Date(r.updated_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { total, pending, inTransit, deliveredThisMonth };
  }, [requests]);

  const requestsByStatus = useMemo(() => {
    const map: Record<string, LiftRequest[]> = {};
    DISPLAY_COLUMNS.forEach((col) => {
      map[col.status] = requests.filter((r) => r.status === col.status);
    });
    return map;
  }, [requests]);

  if (isLoading) {
    return (
      <Card title="LIFT REQUESTS">
        <div className="p-10 text-center">
          <div className="skeleton w-[200px] h-[16px] mx-auto mb-3" />
          <div className="skeleton w-[300px] h-[12px] mx-auto"  />
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary stats */}
      <div
        className="grid gap-3 grid-cols-4"
      >
        {[
          { label: 'TOTAL REQUESTS', value: stats.total, color: 'var(--color-text-bright)' },
          { label: 'PENDING', value: stats.pending, color: stats.pending > 0 ? '#facc15' : 'var(--color-text-muted)' },
          { label: 'IN TRANSIT', value: stats.inTransit, color: stats.inTransit > 0 ? '#4ade80' : 'var(--color-text-muted)' },
          { label: 'DELIVERED (MTD)', value: stats.deliveredThisMonth, color: '#60a5fa' },
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

      {/* Create button */}
      <div className="flex justify-end">
        <button
          onClick={onCreateRequest}
          className="inline-flex items-center gap-1.5 py-[7px] px-3.5 font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] uppercase text-[var(--color-accent)] bg-[rgba(77,171,247,0.1)] border border-[var(--color-accent)] rounded-[var(--radius)] cursor-pointer"
        >
          <Plus size={13} /> NEW REQUEST
        </button>
      </div>

      {/* Column board */}
      <div
        className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'start' }}
      >
        {DISPLAY_COLUMNS.map((col) => {
          const items = requestsByStatus[col.status] ?? [];
          return (
            <div
              key={col.status}
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] min-h-[200px]" style={{ borderTop: `3px solid ${col.accentColor}` }}
            >
              {/* Column header */}
              <div
                className="py-2.5 px-3 border-b border-b-[var(--color-border)] flex items-center justify-between"
              >
                <span
                  className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)]"
                >
                  {col.label}
                </span>
                <span
                  className="inline-block py-px px-1.5 rounded-[8px] font-[var(--font-mono)] text-[9px] font-bold" style={{ backgroundColor: `${col.accentColor}20`, color: col.accentColor }}
                >
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="p-2 flex flex-col gap-2">
                {items.length === 0 && (
                  <div
                    className="p-5 text-center font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
                  >
                    No requests
                  </div>
                )}
                {items.map((req) => {
                  const pc = PRIORITY_COLORS[req.priority];
                  const isExpanded = expandedId === req.id;
                  return (
                    <div
                      key={req.id}
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      className="py-2.5 px-3 bg-[var(--color-bg-surface)] rounded-[var(--radius)] cursor-pointer" style={{ border: `1px solid ${req.priority === 'EMERGENCY' ? 'rgba(248, 113, 113, 0.4)' : 'var(--color-border)'}`, transition: 'border-color 0.15s' }}
                    >
                      {/* Priority + cargo type */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className="inline-block py-px px-1.5 rounded-[2px] font-[var(--font-mono)] text-[8px] font-bold" style={{ color: pc.text, backgroundColor: pc.bg, border: `1px solid ${pc.border}` }}
                        >
                          {req.priority}
                        </span>
                        <div className="flex items-center gap-1">
                          <CargoIcon type={req.cargo_type} />
                          <span
                            className="font-[var(--font-mono)] text-[8px] text-[var(--color-text-muted)]"
                          >
                            {req.cargo_type}
                          </span>
                        </div>
                      </div>

                      {/* Pickup -> Delivery */}
                      <div
                        className="font-[var(--font-mono)] text-[9px] text-[var(--color-text)] mb-1"
                      >
                        {req.pickup_location}
                      </div>
                      <div
                        className="font-[var(--font-mono)] text-[9px] text-[var(--color-accent)] mb-1.5 flex items-center gap-1"
                      >
                        <span className="text-[var(--color-text-muted)]">&#8594;</span> {req.delivery_location}
                      </div>

                      {/* Weight/PAX + date */}
                      <div
                        className="flex justify-between font-[var(--font-mono)] text-[8px] text-[var(--color-text-muted)]"
                      >
                        <span>
                          {req.weight_lbs ? `${(req.weight_lbs / 1000).toFixed(1)}K lbs` : ''}
                          {req.weight_lbs && req.pax_count > 0 ? ' / ' : ''}
                          {req.pax_count > 0 ? `${req.pax_count} PAX` : ''}
                          {!req.weight_lbs && req.pax_count === 0 ? '--' : ''}
                        </span>
                        <span>RDD: {req.required_delivery_date}</span>
                      </div>

                      {/* Hazmat indicator */}
                      {req.hazmat && (
                        <div
                          className="mt-1 flex items-center gap-1 font-[var(--font-mono)] text-[8px] font-bold text-[#fb923c]"
                        >
                          <AlertTriangle size={10} /> HAZMAT
                        </div>
                      )}

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div
                          className="mt-2 pt-2 border-t border-t-[var(--color-border)] font-[var(--font-mono)] text-[9px] text-[var(--color-text)] leading-normal"
                        >
                          <div className="mb-1">
                            <strong className="text-[var(--color-text-muted)]">CARGO:</strong>{' '}
                            {req.cargo_description}
                          </div>
                          <div className="mb-1">
                            <strong className="text-[var(--color-text-muted)]">UNIT:</strong>{' '}
                            {req.requesting_unit_name}
                            {req.supporting_unit_name && ` (Spt: ${req.supporting_unit_name})`}
                          </div>
                          {req.cube_ft && (
                            <div>
                              <strong className="text-[var(--color-text-muted)]">CUBE:</strong>{' '}
                              {req.cube_ft} ft3
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
