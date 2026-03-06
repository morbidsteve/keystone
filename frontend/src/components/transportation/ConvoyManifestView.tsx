// =============================================================================
// ConvoyManifestView — Full manifest view for a convoy (vehicles + crew + cargo)
// =============================================================================

import { useQuery } from '@tanstack/react-query';
import { Truck, Users, Package, AlertTriangle } from 'lucide-react';
import { getMovementManifest } from '@/api/transportation';
import type { FullManifestVehicle, ConvoyCargoItem } from '@/lib/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConvoyManifestViewProps {
  movementId: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  DRIVER: { bg: 'rgba(96, 165, 250, 0.15)', text: '#60a5fa', border: 'rgba(96, 165, 250, 0.4)' },
  A_DRIVER: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.4)' },
  TC: { bg: 'rgba(250, 204, 21, 0.15)', text: '#facc15', border: 'rgba(250, 204, 21, 0.4)' },
  VC: { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c', border: 'rgba(251, 146, 60, 0.4)' },
  GUNNER: { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171', border: 'rgba(248, 113, 113, 0.4)' },
  MEDIC: { bg: 'rgba(74, 222, 128, 0.15)', text: '#4ade80', border: 'rgba(74, 222, 128, 0.4)' },
  PAX: { bg: 'rgba(148, 163, 184, 0.10)', text: '#64748b', border: 'rgba(148, 163, 184, 0.3)' },
};

function getRoleColor(role: string) {
  return ROLE_COLORS[role] ?? ROLE_COLORS.PAX;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ConvoyManifestView({ movementId }: ConvoyManifestViewProps) {
  const { data: manifest, isLoading, error } = useQuery({
    queryKey: ['movement-manifest', movementId],
    queryFn: () => getMovementManifest(movementId),
    enabled: movementId > 0,
  });

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  };

  const fieldLabel: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    letterSpacing: '0.5px',
    marginBottom: 2,
  };

  const fieldValue: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--color-text)',
    lineHeight: 1.4,
  };

  if (movementId <= 0) {
    return (
      <div
        className="p-6 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
      >
        No movement associated with this plan. Manifest will be available once a movement is created.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="p-6 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
      >
        Loading manifest...
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div
        className="p-6 text-center font-[var(--font-mono)] text-[11px] text-[#f87171]"
      >
        Failed to load manifest data.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div style={sectionLabel}>
          <Truck size={12} />
          CONVOY {manifest.convoy_id} — {manifest.vehicles.length} VEHICLES
        </div>
      </div>

      {/* Vehicle cards */}
      {manifest.vehicles.map((vehicle: FullManifestVehicle) => (
        <div
          key={vehicle.convoy_vehicle_id}
          className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-3.5"
        >
          {/* Vehicle header */}
          <div
            className="flex items-center gap-3 mb-2.5 pb-2 border-b border-b-[var(--color-border)]"
          >
            <Truck size={14} className="text-[var(--color-accent)]" />
            <div>
              <div
                className="font-[var(--font-mono)] text-[11px] font-bold text-[var(--color-text-bright)]"
              >
                {vehicle.vehicle_type}
              </div>
              <div
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
              >
                BUMPER: {vehicle.bumper_number} | TAMCN: {vehicle.tamcn}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Crew section */}
            <div>
              <div style={{ ...sectionLabel, marginBottom: 6 }}>
                <Users size={10} /> CREW
              </div>
              {vehicle.personnel.length === 0 ? (
                <div
                  className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] italic"
                >
                  No crew assigned
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {vehicle.personnel.map((p, idx) => {
                    const rc = getRoleColor(p.role);
                    return (
                      <div
                        key={`${p.id}-${idx}`}
                        className="flex items-center gap-2"
                      >
                        <span
                          className="inline-block py-px px-1.5 rounded-[2px] font-[var(--font-mono)] text-[8px] font-bold tracking-[0.5px] min-w-[55px] text-center" style={{ color: rc.text, backgroundColor: rc.bg, border: `1px solid ${rc.border}` }}
                        >
                          {p.role}
                        </span>
                        <span style={{ ...fieldValue, fontSize: 10 }}>
                          {p.rank} {p.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cargo section */}
            <div>
              <div style={{ ...sectionLabel, marginBottom: 6 }}>
                <Package size={10} /> CARGO
              </div>
              {vehicle.cargo.length === 0 ? (
                <div
                  className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] italic"
                >
                  No cargo loaded
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {vehicle.cargo.map((c: ConvoyCargoItem) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="flex-1">
                        {c.description ?? 'Unknown item'}
                        {c.is_hazmat && (
                          <span
                            className="inline-block ml-1.5 py-0 px-1 rounded-[2px] font-[var(--font-mono)] text-[8px] font-bold text-[#f87171] bg-[rgba(248,113,113,0.15)] align-middle border border-[rgba(248,113,113,0.4)]"
                          >
                            <AlertTriangle size={8} className="mr-0.5 align-middle" />
                            HAZMAT
                          </span>
                        )}
                      </span>
                      <span
                        className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] whitespace-nowrap"
                      >
                        x{c.quantity}
                        {c.weight_lbs != null && ` / ${c.weight_lbs} lbs`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total weight */}
              {vehicle.total_cargo_weight > 0 && (
                <div
                  className="mt-1.5 pt-1 border-t border-t-[var(--color-border)] font-[var(--font-mono)] text-[10px] font-semibold text-[var(--color-text-bright)]"
                >
                  TOTAL: {vehicle.total_cargo_weight.toLocaleString()} lbs
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {manifest.vehicles.length === 0 && (
        <div
          className="p-5 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
        >
          No vehicles in this convoy manifest.
        </div>
      )}
    </div>
  );
}
