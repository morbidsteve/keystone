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
        className="p-10 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
      >
        No medical facilities found
      </div>
    );
  }

  return (
    <div
      className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]"
    >
      {facilities.map((f) => {
        const pct = f.capacity > 0 ? (f.current_census / f.capacity) * 100 : 0;
        const color = statusColor(f.status);

        return (
          <div
            key={f.id}
            className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] p-4" style={{ borderTop: `2px solid ${color}` }}
          >
            {/* Header */}
            <div
              className="flex items-start justify-between mb-3"
            >
              <div>
                <div
                  className="font-[var(--font-mono)] text-[13px] font-bold text-[var(--color-text-bright)] mb-0.5"
                >
                  {f.name}
                </div>
                <div
                  className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[0.5px]"
                >
                  {facilityTypeLabel(f.facility_type)}
                </div>
                {f.callsign && (
                  <div
                    className="font-[var(--font-mono)] text-[9px] text-[var(--color-accent)] mt-0.5"
                  >
                    CALLSIGN: {f.callsign}
                  </div>
                )}
              </div>
              <span
                className="inline-block py-0.5 px-2 rounded-[2px] font-[var(--font-mono)] text-[8px] font-bold tracking-[1px] uppercase" style={{ color,
                  backgroundColor: `${color}18`, border: `1px solid ${color}40` }}
              >
                {f.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Capacity Bar */}
            <div className="mb-3">
              <div
                className="flex justify-between mb-1"
              >
                <span
                  className="font-[var(--font-mono)] text-[9px] tracking-[1.5px] text-[var(--color-text-muted)] uppercase"
                >
                  CENSUS
                </span>
                <span
                  className="font-[var(--font-mono)] text-[10px] font-semibold" style={{ color: capacityColor(pct) }}
                >
                  {f.current_census} / {f.capacity}
                </span>
              </div>
              <div
                className="w-full h-[6px] bg-[var(--color-border)] rounded-[3px] overflow-hidden"
              >
                <div
                  className="h-full rounded-[3px]" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: capacityColor(pct), transition: 'width var(--transition)' }}
                />
              </div>
            </div>

            {/* Capability Icons */}
            <div
              className="flex gap-3 mb-3 flex-wrap"
            >
              {f.surgical_capability && (
                <div
                  className="flex items-center gap-1 font-[var(--font-mono)] text-[9px] text-[#22c55e]"
                >
                  <Activity size={12} />
                  SURGICAL
                </div>
              )}
              {f.blood_bank && (
                <div
                  className="flex items-center gap-1 font-[var(--font-mono)] text-[9px] text-[#ef4444]"
                >
                  <Droplets size={12} />
                  BLOOD BANK
                </div>
              )}
              {f.vent_capacity > 0 && (
                <div
                  className="flex items-center gap-1 font-[var(--font-mono)] text-[9px] text-[#3b82f6]"
                >
                  <Building size={12} />
                  VENT x{f.vent_capacity}
                </div>
              )}
            </div>

            {/* Staffing */}
            <div
              className="border-t border-t-[var(--color-border)] pt-2.5"
            >
              <div
                className="font-[var(--font-mono)] text-[9px] tracking-[1.5px] text-[var(--color-text-muted)] uppercase mb-1.5 flex items-center gap-1"
              >
                <Users size={10} />
                STAFFING
              </div>
              <div
                className="grid gap-2 grid-cols-4"
              >
                {[
                  { label: 'MD', value: f.physician_staffing },
                  { label: 'PA', value: f.pa_staffing },
                  { label: 'MEDIC', value: f.medic_staffing },
                  { label: 'SURG', value: f.surgical_tech_staffing },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div
                      className="font-[var(--font-mono)] text-base font-bold text-[var(--color-text-bright)]"
                    >
                      {s.value}
                    </div>
                    <div
                      className="font-[var(--font-mono)] text-[8px] tracking-[1px] text-[var(--color-text-muted)] uppercase"
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
                className="mt-2 font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
              >
                FREQ: <span className="text-[var(--color-text)]">{f.contact_freq}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
