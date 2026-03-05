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
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="skeleton" style={{ width: 200, height: 16, margin: '0 auto 12px' }} />
          <div className="skeleton" style={{ width: 300, height: 12, margin: '0 auto' }} />
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}
      >
        {[
          { label: 'TOTAL REQUESTS', value: stats.total, color: 'var(--color-text-bright)' },
          { label: 'PENDING', value: stats.pending, color: stats.pending > 0 ? '#facc15' : 'var(--color-text-muted)' },
          { label: 'IN TRANSIT', value: stats.inTransit, color: stats.inTransit > 0 ? '#4ade80' : 'var(--color-text-muted)' },
          { label: 'DELIVERED (MTD)', value: stats.deliveredThisMonth, color: '#60a5fa' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              padding: '14px 16px',
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
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {kpi.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 22,
                fontWeight: 700,
                color: kpi.color,
              }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Create button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onCreateRequest}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            backgroundColor: 'rgba(77, 171, 247, 0.1)',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
          }}
        >
          <Plus size={13} /> NEW REQUEST
        </button>
      </div>

      {/* Column board */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          alignItems: 'start',
        }}
      >
        {DISPLAY_COLUMNS.map((col) => {
          const items = requestsByStatus[col.status] ?? [];
          return (
            <div
              key={col.status}
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderTop: `3px solid ${col.accentColor}`,
                borderRadius: 'var(--radius)',
                minHeight: 200,
              }}
            >
              {/* Column header */}
              <div
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '1.5px',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {col.label}
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '1px 6px',
                    borderRadius: 8,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 700,
                    backgroundColor: `${col.accentColor}20`,
                    color: col.accentColor,
                  }}
                >
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.length === 0 && (
                  <div
                    style={{
                      padding: 20,
                      textAlign: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--color-text-muted)',
                    }}
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
                      style={{
                        padding: '10px 12px',
                        backgroundColor: 'var(--color-bg-surface)',
                        border: `1px solid ${req.priority === 'EMERGENCY' ? 'rgba(248, 113, 113, 0.4)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s',
                      }}
                    >
                      {/* Priority + cargo type */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '1px 6px',
                            borderRadius: 2,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 8,
                            fontWeight: 700,
                            color: pc.text,
                            backgroundColor: pc.bg,
                            border: `1px solid ${pc.border}`,
                          }}
                        >
                          {req.priority}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CargoIcon type={req.cargo_type} />
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 8,
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            {req.cargo_type}
                          </span>
                        </div>
                      </div>

                      {/* Pickup -> Delivery */}
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          color: 'var(--color-text)',
                          marginBottom: 4,
                        }}
                      >
                        {req.pickup_location}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          color: 'var(--color-accent)',
                          marginBottom: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span style={{ color: 'var(--color-text-muted)' }}>&#8594;</span> {req.delivery_location}
                      </div>

                      {/* Weight/PAX + date */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 8,
                          color: 'var(--color-text-muted)',
                        }}
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
                          style={{
                            marginTop: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 8,
                            fontWeight: 700,
                            color: '#fb923c',
                          }}
                        >
                          <AlertTriangle size={10} /> HAZMAT
                        </div>
                      )}

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div
                          style={{
                            marginTop: 8,
                            paddingTop: 8,
                            borderTop: '1px solid var(--color-border)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            color: 'var(--color-text)',
                            lineHeight: 1.5,
                          }}
                        >
                          <div style={{ marginBottom: 4 }}>
                            <strong style={{ color: 'var(--color-text-muted)' }}>CARGO:</strong>{' '}
                            {req.cargo_description}
                          </div>
                          <div style={{ marginBottom: 4 }}>
                            <strong style={{ color: 'var(--color-text-muted)' }}>UNIT:</strong>{' '}
                            {req.requesting_unit_name}
                            {req.supporting_unit_name && ` (Spt: ${req.supporting_unit_name})`}
                          </div>
                          {req.cube_ft && (
                            <div>
                              <strong style={{ color: 'var(--color-text-muted)' }}>CUBE:</strong>{' '}
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
