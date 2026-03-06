import { Trash2, Plus, Users, Truck, Shield, UserPlus } from 'lucide-react';
import type {
  ConvoyVehicle,
  ConvoyPersonnelAssignment,
  PersonnelSummary,
} from './types';
import { ConvoyRole, inputStyle, smallBtnStyle, addBtnStyle, labelStyle, DEFAULT_ROLES } from './types';
import { SectionHeader } from './RouteForm';
import { PersonnelSearch } from './PersonnelSearch';
import { AssignedPersonRow } from './PersonnelSearch';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PersonnelAssignmentProps {
  expanded: boolean;
  onToggle: () => void;
  // Mode
  personnelMode: 'summary' | 'detailed';
  onSetPersonnelMode: (mode: 'summary' | 'detailed') => void;
  // Summary mode
  personnelRoles: { role: string; count: number }[];
  onSetPersonnelRoles: React.Dispatch<React.SetStateAction<{ role: string; count: number }[]>>;
  // Detailed mode
  convoyVehicles: ConvoyVehicle[];
  unassignedPersonnel: ConvoyPersonnelAssignment[];
  totalDetailedPersonnel: number;
  // Personnel search
  personnelSearchQuery: string;
  personnelSearchResults: PersonnelSummary[];
  personnelSearchLoading: boolean;
  assignTargetVehicleId: string | null;
  showRoleSelector: string | null;
  // Search handlers
  onSetPersonnelSearchQuery: (q: string) => void;
  onSetAssignTargetVehicleId: (id: string | null) => void;
  onSetShowRoleSelector: (id: string | null) => void;
  onSetPersonnelSearchResults: (results: PersonnelSummary[]) => void;
  // Personnel handlers
  onAssignPersonnel: (person: PersonnelSummary, vehicleId: string | null, role: ConvoyRole) => void;
  onRemoveAssignedPersonnel: (assignmentId: string, vehicleId: string | null) => void;
  onUpdateConvoyVehicle: (vehicleId: string, field: 'bumperNumber' | 'callSign', value: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PersonnelAssignment({
  expanded,
  onToggle,
  personnelMode,
  onSetPersonnelMode,
  personnelRoles,
  onSetPersonnelRoles,
  convoyVehicles,
  unassignedPersonnel,
  totalDetailedPersonnel,
  personnelSearchQuery,
  personnelSearchResults,
  personnelSearchLoading,
  assignTargetVehicleId,
  showRoleSelector,
  onSetPersonnelSearchQuery,
  onSetAssignTargetVehicleId,
  onSetShowRoleSelector,
  onSetPersonnelSearchResults,
  onAssignPersonnel,
  onRemoveAssignedPersonnel,
  onUpdateConvoyVehicle,
}: PersonnelAssignmentProps) {
  const searchProps = {
    personnelSearchQuery,
    personnelSearchResults,
    personnelSearchLoading,
    showRoleSelector,
    onSetPersonnelSearchQuery,
    onSetAssignTargetVehicleId,
    onSetShowRoleSelector,
    onSetPersonnelSearchResults,
    onAssignPersonnel,
  };

  return (
    <div>
      <SectionHeader
        title="PERSONNEL"
        expanded={expanded}
        onToggle={onToggle}
        count={
          personnelMode === 'detailed'
            ? totalDetailedPersonnel
            : personnelRoles.reduce((sum, p) => sum + p.count, 0)
        }
      />
      {expanded && (
        <div className="pt-2">
          {/* Mode toggle */}
          <div
            className="flex mb-2 border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden"
          >
            <button
              onClick={() => onSetPersonnelMode('summary')}
              className="flex-1 py-1.5 px-2 font-[var(--font-mono)] text-[9px] font-bold tracking-[0.5px] border-0 cursor-pointer" style={{ backgroundColor: personnelMode === 'summary' ? 'var(--color-accent)' : 'var(--color-bg)', color: personnelMode === 'summary' ? '#fff' : 'var(--color-text-muted)' }}
            >
              SUMMARY
            </button>
            <button
              onClick={() => onSetPersonnelMode('detailed')}
              className="flex-1 py-1.5 px-2 font-[var(--font-mono)] text-[9px] font-bold tracking-[0.5px] border-0 border-l border-l-[var(--color-border)] cursor-pointer" style={{ backgroundColor: personnelMode === 'detailed' ? 'var(--color-accent)' : 'var(--color-bg)', color: personnelMode === 'detailed' ? '#fff' : 'var(--color-text-muted)' }}
            >
              DETAILED
            </button>
          </div>

          {/* SUMMARY MODE */}
          {personnelMode === 'summary' && (
            <>
              {personnelRoles.map((p, idx) => (
                <div
                  key={idx}
                  className="grid gap-1 items-center mb-1" style={{ gridTemplateColumns: '1fr 60px 24px' }}
                >
                  <input
                    value={p.role}
                    onChange={e => {
                      const next = [...personnelRoles];
                      next[idx] = { ...next[idx], role: e.target.value };
                      onSetPersonnelRoles(next);
                    }}
                    placeholder="Role"
                    className="text-[10px]"
                  />
                  <input
                    type="number"
                    min={0}
                    value={p.count}
                    onChange={e => {
                      const next = [...personnelRoles];
                      next[idx] = { ...next[idx], count: parseInt(e.target.value) || 0 };
                      onSetPersonnelRoles(next);
                    }}
                    className="text-[10px]"
                  />
                  <button
                    onClick={() => onSetPersonnelRoles(prev => prev.filter((_, i) => i !== idx))}
                    style={{ ...smallBtnStyle, color: 'var(--color-danger)' }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
              <div className="flex gap-1 flex-wrap mb-1">
                {DEFAULT_ROLES.filter(role => !personnelRoles.find(p => p.role === role)).map(
                  role => (
                    <button
                      key={role}
                      onClick={() => onSetPersonnelRoles(prev => [...prev, { role, count: 0 }])}
                      className="py-0.5 px-1.5 font-[var(--font-mono)] text-[8px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text-muted)] cursor-pointer"
                    >
                      + {role}
                    </button>
                  ),
                )}
              </div>
              <button
                onClick={() => onSetPersonnelRoles(prev => [...prev, { role: '', count: 0 }])}
                style={addBtnStyle}
              >
                <Plus size={11} /> ADD ROLE
              </button>
              <div
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mt-1"
              >
                <Users size={10} className="align-middle mr-1" />
                TOTAL: {personnelRoles.reduce((sum, p) => sum + p.count, 0)} PERSONNEL
              </div>
            </>
          )}

          {/* DETAILED MODE */}
          {personnelMode === 'detailed' && (
            <>
              {/* Convoy Vehicles */}
              <div style={{ ...labelStyle, marginBottom: 6 }}>
                <Truck size={10} className="align-middle mr-1" />
                CONVOY VEHICLES ({convoyVehicles.length})
              </div>

              {convoyVehicles.length === 0 && (
                <div
                  className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] py-2 px-0"
                >
                  Add vehicles in the Vehicles section above to assign personnel.
                </div>
              )}

              {convoyVehicles.map(cv => (
                <div
                  key={cv.id}
                  className="mb-2 p-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)]"
                >
                  {/* Vehicle header */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Truck size={12} className="text-[var(--color-accent)] shrink-0" />
                    <span
                      className="font-[var(--font-mono)] text-[10px] font-bold text-[var(--color-text-bright)]"
                    >
                      {cv.vehicleType || 'VEHICLE'} #{cv.sequenceNumber}
                    </span>
                  </div>

                  {/* Bumper number + call sign */}
                  <div className="grid gap-1 mb-1.5 grid-cols-2">
                    <div>
                      <div style={{ ...labelStyle, fontSize: 8 }}>BUMPER #</div>
                      <input
                        value={cv.bumperNumber || ''}
                        onChange={e => onUpdateConvoyVehicle(cv.id, 'bumperNumber', e.target.value)}
                        placeholder="e.g. HQ-01"
                        className="text-[9px]"
                      />
                    </div>
                    <div>
                      <div style={{ ...labelStyle, fontSize: 8 }}>CALL SIGN</div>
                      <input
                        value={cv.callSign || ''}
                        onChange={e => onUpdateConvoyVehicle(cv.id, 'callSign', e.target.value)}
                        placeholder="e.g. RAIDER-1"
                        className="text-[9px]"
                      />
                    </div>
                  </div>

                  {/* Assigned personnel list */}
                  {cv.assignedPersonnel.length > 0 && (
                    <div className="mb-1">
                      {cv.assignedPersonnel.map(ap => (
                        <AssignedPersonRow key={ap.id} ap={ap} vehicleId={cv.id} onRemove={onRemoveAssignedPersonnel} />
                      ))}
                    </div>
                  )}

                  {/* Assign personnel button + search */}
                  {assignTargetVehicleId === cv.id ? (
                    <PersonnelSearch vehicleId={cv.id} {...searchProps} />
                  ) : (
                    <button
                      onClick={() => {
                        onSetAssignTargetVehicleId(cv.id);
                        onSetPersonnelSearchQuery('');
                        onSetPersonnelSearchResults([]);
                        onSetShowRoleSelector(null);
                      }}
                      className="py-[3px] px-1.5"
                    >
                      <UserPlus size={10} /> ASSIGN PERSONNEL
                    </button>
                  )}
                </div>
              ))}

              {/* Unassigned Personnel */}
              <div className="mb-1.5">
                <Shield size={10} className="align-middle mr-1" />
                UNASSIGNED PERSONNEL ({unassignedPersonnel.length})
              </div>

              {unassignedPersonnel.map(ap => (
                <AssignedPersonRow key={ap.id} ap={ap} vehicleId={null} onRemove={onRemoveAssignedPersonnel} />
              ))}

              {/* Add unassigned personnel */}
              {assignTargetVehicleId === '__unassigned__' ? (
                <div className="mt-1">
                  <PersonnelSearch vehicleId={null} {...searchProps} />
                </div>
              ) : (
                <button
                  onClick={() => {
                    onSetAssignTargetVehicleId('__unassigned__');
                    onSetPersonnelSearchQuery('');
                    onSetPersonnelSearchResults([]);
                    onSetShowRoleSelector(null);
                  }}
                  style={{ ...addBtnStyle, marginTop: 4 }}
                >
                  <UserPlus size={10} /> ADD UNASSIGNED PERSONNEL
                </button>
              )}

              {/* Total count */}
              <div
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mt-2"
              >
                <Users size={10} className="align-middle mr-1" />
                TOTAL: {totalDetailedPersonnel} PERSONNEL
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
