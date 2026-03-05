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
        style={{
          padding: 24,
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-muted)',
        }}
      >
        No movement associated with this plan. Manifest will be available once a movement is created.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-muted)',
        }}
      >
        Loading manifest...
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: '#f87171',
        }}
      >
        Failed to load manifest data.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={sectionLabel}>
          <Truck size={12} />
          CONVOY {manifest.convoy_id} — {manifest.vehicles.length} VEHICLES
        </div>
      </div>

      {/* Vehicle cards */}
      {manifest.vehicles.map((vehicle: FullManifestVehicle) => (
        <div
          key={vehicle.convoy_vehicle_id}
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: 14,
          }}
        >
          {/* Vehicle header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 10,
              paddingBottom: 8,
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <Truck size={14} style={{ color: 'var(--color-accent)' }} />
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--color-text-bright)',
                }}
              >
                {vehicle.vehicle_type}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                }}
              >
                BUMPER: {vehicle.bumper_number} | TAMCN: {vehicle.tamcn}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Crew section */}
            <div>
              <div style={{ ...sectionLabel, marginBottom: 6 }}>
                <Users size={10} /> CREW
              </div>
              {vehicle.personnel.length === 0 ? (
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  No crew assigned
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {vehicle.personnel.map((p, idx) => {
                    const rc = getRoleColor(p.role);
                    return (
                      <div
                        key={`${p.id}-${idx}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '1px 6px',
                            borderRadius: 2,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 8,
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            color: rc.text,
                            backgroundColor: rc.bg,
                            border: `1px solid ${rc.border}`,
                            minWidth: 55,
                            textAlign: 'center',
                          }}
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
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  No cargo loaded
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {vehicle.cargo.map((c: ConvoyCargoItem) => (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span style={{ ...fieldValue, fontSize: 10, flex: 1 }}>
                        {c.description ?? 'Unknown item'}
                        {c.is_hazmat && (
                          <span
                            style={{
                              display: 'inline-block',
                              marginLeft: 6,
                              padding: '0px 4px',
                              borderRadius: 2,
                              fontFamily: 'var(--font-mono)',
                              fontSize: 8,
                              fontWeight: 700,
                              color: '#f87171',
                              backgroundColor: 'rgba(248, 113, 113, 0.15)',
                              border: '1px solid rgba(248, 113, 113, 0.4)',
                              verticalAlign: 'middle',
                            }}
                          >
                            <AlertTriangle size={8} style={{ marginRight: 2, verticalAlign: 'middle' }} />
                            HAZMAT
                          </span>
                        )}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          color: 'var(--color-text-muted)',
                          whiteSpace: 'nowrap',
                        }}
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
                  style={{
                    marginTop: 6,
                    paddingTop: 4,
                    borderTop: '1px solid var(--color-border)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--color-text-bright)',
                  }}
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
          style={{
            padding: 20,
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-muted)',
          }}
        >
          No vehicles in this convoy manifest.
        </div>
      )}
    </div>
  );
}
