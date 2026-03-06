// =============================================================================
// PersonnelAssignmentModal — Assign personnel to convoy vehicle positions
// =============================================================================

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Shield, Truck, X, Plus, AlertTriangle } from 'lucide-react';
import { getQualifiedPersonnel } from '@/api/personnel';
import type { QualifiedPersonnelItem } from '@/lib/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PersonnelAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: number;
  vehicleTamcn: string;
  vehicleType: string;
  bumperNumber: string;
  movementId: number;
  onSave: (assignments: { role: string; personnel_id: number }[]) => void;
}

// ---------------------------------------------------------------------------
// Crew roles
// ---------------------------------------------------------------------------

const CREW_ROLES: { key: string; label: string; required: boolean }[] = [
  { key: 'DRIVER', label: 'DRIVER', required: true },
  { key: 'A_DRIVER', label: 'ASSISTANT DRIVER', required: false },
  { key: 'TC', label: 'TRUCK COMMANDER', required: false },
  { key: 'VC', label: 'VEHICLE COMMANDER', required: false },
  { key: 'GUNNER', label: 'GUNNER', required: false },
  { key: 'MEDIC', label: 'MEDIC', required: false },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PersonnelAssignmentModal({
  isOpen,
  onClose,
  vehicleId,
  vehicleTamcn,
  vehicleType,
  bumperNumber,
  movementId,
  onSave,
}: PersonnelAssignmentModalProps) {
  const [selections, setSelections] = useState<Record<string, number | null>>({
    DRIVER: null,
    A_DRIVER: null,
    TC: null,
    VC: null,
    GUNNER: null,
    MEDIC: null,
  });
  const [paxList, setPaxList] = useState<number[]>([]);
  const [paxDropdownValue, setPaxDropdownValue] = useState<number | null>(null);

  // Fetch qualified personnel for each role
  const driverQuery = useQuery({
    queryKey: ['qualified-personnel', 'DRIVER', vehicleTamcn],
    queryFn: () => getQualifiedPersonnel('DRIVER', vehicleTamcn),
    enabled: isOpen,
  });
  const aDriverQuery = useQuery({
    queryKey: ['qualified-personnel', 'A_DRIVER', vehicleTamcn],
    queryFn: () => getQualifiedPersonnel('A_DRIVER', vehicleTamcn),
    enabled: isOpen,
  });
  const tcQuery = useQuery({
    queryKey: ['qualified-personnel', 'TC', vehicleTamcn],
    queryFn: () => getQualifiedPersonnel('TC', vehicleTamcn),
    enabled: isOpen,
  });
  const vcQuery = useQuery({
    queryKey: ['qualified-personnel', 'VC', vehicleTamcn],
    queryFn: () => getQualifiedPersonnel('VC', vehicleTamcn),
    enabled: isOpen,
  });
  const gunnerQuery = useQuery({
    queryKey: ['qualified-personnel', 'GUNNER', vehicleTamcn],
    queryFn: () => getQualifiedPersonnel('GUNNER', vehicleTamcn),
    enabled: isOpen,
  });
  const medicQuery = useQuery({
    queryKey: ['qualified-personnel', 'MEDIC', vehicleTamcn],
    queryFn: () => getQualifiedPersonnel('MEDIC', vehicleTamcn),
    enabled: isOpen,
  });
  const paxQuery = useQuery({
    queryKey: ['qualified-personnel', 'PAX', vehicleTamcn],
    queryFn: () => getQualifiedPersonnel('PAX', vehicleTamcn),
    enabled: isOpen,
  });

  const queryMap: Record<string, typeof driverQuery> = {
    DRIVER: driverQuery,
    A_DRIVER: aDriverQuery,
    TC: tcQuery,
    VC: vcQuery,
    GUNNER: gunnerQuery,
    MEDIC: medicQuery,
  };

  const canSave = useMemo(() => selections.DRIVER != null, [selections]);

  const handleRoleChange = (role: string, personnelId: number | null) => {
    setSelections((prev) => ({ ...prev, [role]: personnelId }));
  };

  const handleAddPax = () => {
    if (paxDropdownValue != null && !paxList.includes(paxDropdownValue)) {
      setPaxList((prev) => [...prev, paxDropdownValue]);
      setPaxDropdownValue(null);
    }
  };

  const handleRemovePax = (id: number) => {
    setPaxList((prev) => prev.filter((p) => p !== id));
  };

  const handleSave = () => {
    const assignments: { role: string; personnel_id: number }[] = [];
    for (const [role, pid] of Object.entries(selections)) {
      if (pid != null) {
        assignments.push({ role, personnel_id: pid });
      }
    }
    for (const pid of paxList) {
      assignments.push({ role: 'PAX', personnel_id: pid });
    }
    onSave(assignments);
    onClose();
  };

  const formatPersonnel = (p: QualifiedPersonnelItem): string =>
    `${p.rank ?? ''} ${p.last_name}, ${p.first_name} (${p.mos ?? 'N/A'})`;

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1px',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    marginBottom: 4,
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 10px',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--color-text)',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    appearance: 'auto' as React.CSSProperties['appearance'],
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: 2,
    fontFamily: 'var(--font-mono)',
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: '0.5px',
    color: 'var(--color-accent)',
    backgroundColor: 'rgba(77, 171, 247, 0.1)',
    border: '1px solid rgba(77, 171, 247, 0.3)',
    marginRight: 4,
    marginTop: 4,
  };

  const requiredBadge: React.CSSProperties = {
    ...badgeStyle,
    color: '#f87171',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid rgba(248, 113, 113, 0.3)',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-[1000] flex items-center justify-center inset-0">
      <div onClick={onClose} className="absolute bg-[rgba(0,0,0,0.7)] inset-0" />
      <div
        className="relative w-[700px] max-h-[80vh] overflow-auto bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Users size={16} className="text-[var(--color-accent)]" />
            <span
              className="font-[var(--font-mono)] text-[13px] font-bold tracking-[1px] text-[var(--color-text-bright)]"
            >
              ASSIGN PERSONNEL
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-[28px] h-[28px] bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text-muted)] cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Vehicle Info */}
        <div
          className="flex gap-4 py-2.5 px-3.5 mb-5 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
        >
          <div>
            <div style={labelStyle}>VEHICLE TYPE</div>
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-bright)] font-semibold">
              <Truck size={12} className="mr-1 align-middle" />
              {vehicleType}
            </div>
          </div>
          <div>
            <div style={labelStyle}>BUMPER #</div>
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)] font-semibold">
              {bumperNumber}
            </div>
          </div>
          <div>
            <div style={labelStyle}>TAMCN</div>
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-accent)] font-semibold">
              {vehicleTamcn}
            </div>
          </div>
        </div>

        {/* Crew Roles */}
        <div className="flex flex-col gap-3.5 mb-5">
          <div
            className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase flex items-center gap-1.5"
          >
            <Shield size={12} /> CREW ASSIGNMENTS
          </div>

          {CREW_ROLES.map((role) => {
            const query = queryMap[role.key];
            const personnelList = query?.data?.personnel ?? [];
            const requiredQuals = query?.data?.required_qualifications ?? [];
            const isLoading = query?.isLoading ?? false;
            const isEmpty = !isLoading && personnelList.length === 0;

            return (
              <div key={role.key}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span style={labelStyle}>{role.label}</span>
                  {role.required && (
                    <span style={requiredBadge}>REQUIRED</span>
                  )}
                </div>
                <select
                  value={selections[role.key] ?? ''}
                  onChange={(e) =>
                    handleRoleChange(role.key, e.target.value ? Number(e.target.value) : null)
                  }
                  disabled={isLoading}
                  style={{
                    ...selectStyle,
                    opacity: isLoading ? 0.5 : 1,
                  }}
                >
                  <option value="">-- Select {role.label} --</option>
                  {personnelList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatPersonnel(p)}
                    </option>
                  ))}
                </select>
                {/* Required qualifications badges */}
                {requiredQuals.length > 0 && (
                  <div className="mt-1">
                    {requiredQuals.map((q) => (
                      <span key={q} style={badgeStyle}>{q.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                )}
                {/* No qualified personnel warning */}
                {isEmpty && (
                  <div
                    className="flex items-center gap-1 mt-1 font-[var(--font-mono)] text-[10px] text-[#f87171]"
                  >
                    <AlertTriangle size={11} />
                    No qualified personnel available
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* PAX Section */}
        <div className="mb-5">
          <div
            className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase flex items-center gap-1.5 mb-2"
          >
            <Users size={12} /> PASSENGERS (PAX)
          </div>

          {/* Current PAX list */}
          {paxList.length > 0 && (
            <div className="flex flex-col gap-1 mb-2">
              {paxList.map((pid) => {
                const person = paxQuery.data?.personnel.find((p) => p.id === pid);
                return (
                  <div
                    key={pid}
                    className="flex items-center justify-between py-1 px-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
                  >
                    <span
                      className="font-[var(--font-mono)] text-[10px] text-[var(--color-text)]"
                    >
                      {person ? formatPersonnel(person) : `Personnel #${pid}`}
                    </span>
                    <button
                      onClick={() => handleRemovePax(pid)}
                      className="flex items-center justify-center w-[20px] h-[20px] bg-transparent rounded-[2px] text-[#f87171] cursor-pointer border border-[rgba(248,113,113,0.3)]"
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add PAX dropdown + button */}
          <div className="flex gap-2">
            <select
              value={paxDropdownValue ?? ''}
              onChange={(e) => setPaxDropdownValue(e.target.value ? Number(e.target.value) : null)}
              style={{ ...selectStyle, flex: 1 }}
              disabled={paxQuery.isLoading}
            >
              <option value="">-- Select Passenger --</option>
              {(paxQuery.data?.personnel ?? [])
                .filter((p) => !paxList.includes(p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatPersonnel(p)}
                  </option>
                ))}
            </select>
            <button
              onClick={handleAddPax}
              disabled={paxDropdownValue == null}
              className="flex items-center gap-1 py-1.5 px-3 font-[var(--font-mono)] text-[9px] font-semibold bg-transparent border border-[var(--color-border)] rounded-[var(--radius)]" style={{ color: paxDropdownValue != null ? 'var(--color-accent)' : 'var(--color-text-muted)', cursor: paxDropdownValue != null ? 'pointer' : 'default', opacity: paxDropdownValue != null ? 1 : 0.5 }}
            >
              <Plus size={12} /> ADD
            </button>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-2 border-t border-t-[var(--color-border)] pt-4">
          <button
            onClick={onClose}
            className="py-1.5 px-4 font-[var(--font-mono)] text-[10px] font-semibold tracking-[0.5px] text-[var(--color-text-muted)] bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] cursor-pointer"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="py-1.5 px-4 font-[var(--font-mono)] text-[10px] font-semibold tracking-[0.5px] rounded-[var(--radius)]" style={{ color: canSave ? '#4ade80' : 'var(--color-text-muted)', backgroundColor: canSave ? 'rgba(74, 222, 128, 0.1)' : 'transparent', border: canSave ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid var(--color-border)', cursor: canSave ? 'pointer' : 'default', opacity: canSave ? 1 : 0.5 }}
          >
            SAVE ASSIGNMENTS
          </button>
        </div>
      </div>
    </div>
  );
}
