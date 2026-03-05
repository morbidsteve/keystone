// =============================================================================
// MTFStatusCards — Medical Treatment Facility status display
// =============================================================================

import { Building, Activity, Droplets, Users } from 'lucide-react';
import type { MedicalFacility } from '@/lib/types';
import { MTFStatus } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusColor = (s: MTFStatus): string => {
  switch (s) {
    case MTFStatus.OPERATIONAL: return '#22c55e';
    case MTFStatus.DEGRADED: return '#f59e0b';
    case MTFStatus.NON_OPERATIONAL: return '#ef4444';
  }
};

const facilityTypeLabel = (t: string): string => {
  const labels: Record<string, string> = {
    BAS: 'Battalion Aid Station',
    STP: 'Shock Trauma Platoon',
    FRSS: 'Forward Resuscitative Surgery System',
    ROLE2: 'Role 2 (CSH)',
    ROLE2E: 'Role 2 Enhanced',
    ROLE3: 'Role 3 (Combat Hospital)',
    ROLE4: 'Role 4 (CONUS)',
  };
  return labels[t] ?? t;
};

function capacityColor(pct: number): string {
  if (pct >= 90) return '#ef4444';
  if (pct >= 70) return '#f59e0b';
  return '#22c55e';
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MTFStatusCardsProps {
  facilities: MedicalFacility[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MTFStatusCards({ facilities }: MTFStatusCardsProps) {
  if (facilities.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-muted)',
        }}
      >
        No medical facilities found
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 12,
      }}
    >
      {facilities.map((f) => {
        const pct = f.capacity > 0 ? (f.current_census / f.capacity) * 100 : 0;
        const color = statusColor(f.status);

        return (
          <div
            key={f.id}
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              borderTop: `2px solid ${color}`,
              padding: 16,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--color-text-bright)',
                    marginBottom: 2,
                  }}
                >
                  {f.name}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                    letterSpacing: '0.5px',
                  }}
                >
                  {facilityTypeLabel(f.facility_type)}
                </div>
                {f.callsign && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--color-accent)',
                      marginTop: 2,
                    }}
                  >
                    CALLSIGN: {f.callsign}
                  </div>
                )}
              </div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 2,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  color,
                  backgroundColor: `${color}18`,
                  border: `1px solid ${color}40`,
                  textTransform: 'uppercase',
                }}
              >
                {f.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Capacity Bar */}
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '1.5px',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  CENSUS
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 600,
                    color: capacityColor(pct),
                  }}
                >
                  {f.current_census} / {f.capacity}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: 6,
                  backgroundColor: 'var(--color-border)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    height: '100%',
                    backgroundColor: capacityColor(pct),
                    borderRadius: 3,
                    transition: 'width var(--transition)',
                  }}
                />
              </div>
            </div>

            {/* Capability Icons */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                marginBottom: 12,
                flexWrap: 'wrap',
              }}
            >
              {f.surgical_capability && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: '#22c55e',
                  }}
                >
                  <Activity size={12} />
                  SURGICAL
                </div>
              )}
              {f.blood_bank && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: '#ef4444',
                  }}
                >
                  <Droplets size={12} />
                  BLOOD BANK
                </div>
              )}
              {f.vent_capacity > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: '#3b82f6',
                  }}
                >
                  <Building size={12} />
                  VENT x{f.vent_capacity}
                </div>
              )}
            </div>

            {/* Staffing */}
            <div
              style={{
                borderTop: '1px solid var(--color-border)',
                paddingTop: 10,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  letterSpacing: '1.5px',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Users size={10} />
                STAFFING
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                }}
              >
                {[
                  { label: 'MD', value: f.physician_staffing },
                  { label: 'PA', value: f.pa_staffing },
                  { label: 'MEDIC', value: f.medic_staffing },
                  { label: 'SURG', value: f.surgical_tech_staffing },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 16,
                        fontWeight: 700,
                        color: 'var(--color-text-bright)',
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 8,
                        letterSpacing: '1px',
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Freq */}
            {f.contact_freq && (
              <div
                style={{
                  marginTop: 8,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                }}
              >
                FREQ: <span style={{ color: 'var(--color-text)' }}>{f.contact_freq}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
