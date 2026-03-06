import { Search, X } from 'lucide-react';
import type { ConvoyPersonnelAssignment, PersonnelSummary } from './types';
import { ConvoyRole, inputStyle, smallBtnStyle } from './types';

// ---------------------------------------------------------------------------
// PersonnelSearch Props
// ---------------------------------------------------------------------------

export interface PersonnelSearchProps {
  vehicleId: string | null;
  personnelSearchQuery: string;
  personnelSearchResults: PersonnelSummary[];
  personnelSearchLoading: boolean;
  showRoleSelector: string | null;
  onSetPersonnelSearchQuery: (q: string) => void;
  onSetAssignTargetVehicleId: (id: string | null) => void;
  onSetShowRoleSelector: (id: string | null) => void;
  onSetPersonnelSearchResults: (results: PersonnelSummary[]) => void;
  onAssignPersonnel: (person: PersonnelSummary, vehicleId: string | null, role: ConvoyRole) => void;
}

// ---------------------------------------------------------------------------
// PersonnelSearch Component
// ---------------------------------------------------------------------------

export function PersonnelSearch({
  vehicleId,
  personnelSearchQuery,
  personnelSearchResults,
  personnelSearchLoading,
  showRoleSelector,
  onSetPersonnelSearchQuery,
  onSetAssignTargetVehicleId,
  onSetShowRoleSelector,
  onSetPersonnelSearchResults,
  onAssignPersonnel,
}: PersonnelSearchProps) {
  return (
    <div className="relative" style={{ marginBottom: vehicleId === null ? 0 : 4 }}>
      <div
        className="flex items-center gap-1 text-[9px]"
      >
        <Search size={10} className="text-[var(--color-text-muted)] shrink-0" />
        <input
          value={personnelSearchQuery}
          onChange={e => onSetPersonnelSearchQuery(e.target.value)}
          placeholder="Search by name, EDIPI..."
          autoFocus
          className="flex-1 border-0 outline-none bg-transparent text-[var(--color-text)] font-[var(--font-mono)] text-[9px]"
        />
        <button
          onClick={() => {
            onSetAssignTargetVehicleId(null);
            onSetPersonnelSearchQuery('');
            onSetPersonnelSearchResults([]);
            onSetShowRoleSelector(null);
          }}
          className="h-[16px]"
        >
          <X size={9} />
        </button>
      </div>

      {/* Search results dropdown */}
      {personnelSearchResults.length > 0 && (
        <div
          className="absolute left-0 right-0 z-[10] max-h-[160px] overflow-y-auto bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] mt-0.5 top-full"
        >
          {personnelSearchResults.map(person => (
            <div key={person.id}>
              <div
                onClick={() => {
                  if (showRoleSelector === person.id) {
                    onSetShowRoleSelector(null);
                  } else {
                    onSetShowRoleSelector(person.id);
                  }
                }}
                className="py-1 px-2 font-[var(--font-mono)] text-[9px] text-[var(--color-text)] cursor-pointer border-b border-b-[var(--color-border)]" style={{ backgroundColor: showRoleSelector === person.id
                      ? 'rgba(77,171,247,0.1)'
                      : 'transparent' }}
                onMouseEnter={e => {
                  if (showRoleSelector !== person.id)
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }}
                onMouseLeave={e => {
                  if (showRoleSelector !== person.id)
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span className="font-semibold">
                  {person.rank ? `${person.rank} ` : ''}
                  {person.lastName}, {person.firstName}
                </span>
                <span className="text-[var(--color-text-muted)] ml-1.5">
                  ({person.edipi})
                </span>
                {person.mos && (
                  <span className="text-[var(--color-text-muted)] ml-1">
                    — {person.mos}
                  </span>
                )}
              </div>
              {/* Role selector inline */}
              {showRoleSelector === person.id && (
                <div
                  className="flex items-center gap-1 py-1 px-2 bg-[rgba(77,171,247,0.05)] border-b border-b-[var(--color-border)] flex-wrap"
                >
                  <span
                    className="font-[var(--font-mono)] text-[8px] text-[var(--color-text-muted)] mr-0.5"
                  >
                    ROLE:
                  </span>
                  {Object.values(ConvoyRole).map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        onAssignPersonnel(person, vehicleId, role);
                      }}
                      className="py-0.5 px-1.5 font-[var(--font-mono)] text-[8px] font-semibold border border-[var(--color-border)] rounded-[var(--radius)] cursor-pointer" style={{ backgroundColor: vehicleId === null && role === ConvoyRole.PAX ? 'var(--color-accent)' : 'var(--color-bg)', color: vehicleId === null && role === ConvoyRole.PAX ? '#fff' : 'var(--color-text)' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = 'var(--color-accent)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={e => {
                        if (vehicleId === null && role === ConvoyRole.PAX) {
                          e.currentTarget.style.backgroundColor = 'var(--color-accent)';
                          e.currentTarget.style.color = '#fff';
                        } else {
                          e.currentTarget.style.backgroundColor = 'var(--color-bg)';
                          e.currentTarget.style.color = 'var(--color-text)';
                        }
                      }}
                    >
                      {role.replace('_', '-')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {personnelSearchLoading && personnelSearchQuery.length >= 2 && (
        <div
          className="absolute left-0 right-0 py-1.5 px-2 font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] mt-0.5 top-full"
        >
          Searching...
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AssignedPersonRow Props
// ---------------------------------------------------------------------------

export interface AssignedPersonRowProps {
  ap: ConvoyPersonnelAssignment;
  vehicleId: string | null;
  onRemove: (assignmentId: string, vehicleId: string | null) => void;
}

// ---------------------------------------------------------------------------
// AssignedPersonRow Component
// ---------------------------------------------------------------------------

export function AssignedPersonRow({
  ap,
  vehicleId,
  onRemove,
}: AssignedPersonRowProps) {
  return (
    <div
      className="flex items-center gap-1 mb-0.5 rounded-[var(--radius)] font-[var(--font-mono)] text-[9px]" style={{ padding: '3px ' + (vehicleId ? '4px' : '6px'), backgroundColor: vehicleId ? 'var(--color-bg-elevated)' : 'var(--color-bg)', border: vehicleId ? 'none' : '1px solid var(--color-border)' }}
    >
      <span
        className="py-px px-1 rounded-[var(--radius)] text-[#fff] text-[8px] font-bold shrink-0" style={{ backgroundColor: vehicleId ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
      >
        {ap.role.replace('_', '-')}
      </span>
      <span className="flex-1 text-[var(--color-text)]">
        {ap.personnel.rank ? `${ap.personnel.rank} ` : ''}
        {ap.personnel.lastName}, {ap.personnel.firstName}
      </span>
      <span className="text-[var(--color-text-muted)] text-[8px]">
        {ap.personnel.mos || ''}
      </span>
      <button
        onClick={() => onRemove(ap.id, vehicleId)}
        className="h-[18px] text-[var(--color-danger)]"
      >
        <X size={10} />
      </button>
    </div>
  );
}
