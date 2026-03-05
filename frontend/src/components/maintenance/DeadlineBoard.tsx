import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { MaintenanceDeadline, DeadlineReason } from '@/lib/types';
import EmptyState from '@/components/ui/EmptyState';

interface DeadlineBoardProps {
  deadlines: MaintenanceDeadline[];
  onLift?: (id: number) => void;
}

const REASON_COLORS: Record<DeadlineReason, string> = {
  AWAITING_PARTS: '#f59e0b',
  AWAITING_REPAIR: '#3b82f6',
  UNSCHEDULED_MAINTENANCE: '#8b5cf6',
  SAFETY_ISSUE: '#ef4444',
  MODIFICATION_IN_PROGRESS: '#06b6d4',
  PENDING_INSPECTION: '#f97316',
  DEPOT_OVERHAUL: '#6366f1',
};

function getReasonLabel(reason: DeadlineReason): string {
  return reason.replace(/_/g, ' ');
}

interface SeverityGroup {
  label: string;
  color: string;
  items: MaintenanceDeadline[];
}

function groupBySeverity(deadlines: MaintenanceDeadline[]): SeverityGroup[] {
  const active = deadlines.filter((d) => d.liftedDate == null);

  const critical = active.filter((d) => (d.daysDeadlined ?? 0) >= 30);
  const recent = active.filter((d) => {
    const days = d.daysDeadlined ?? 0;
    return days >= 7 && days < 30;
  });
  const fresh = active.filter((d) => (d.daysDeadlined ?? 0) < 7);

  const groups: SeverityGroup[] = [];
  if (critical.length > 0) {
    groups.push({ label: 'CRITICAL (30+ DAYS)', color: 'var(--color-danger)', items: critical });
  }
  if (recent.length > 0) {
    groups.push({ label: 'RECENT (7-30 DAYS)', color: 'var(--color-warning)', items: recent });
  }
  if (fresh.length > 0) {
    groups.push({ label: 'NEW (<7 DAYS)', color: 'var(--color-accent)', items: fresh });
  }
  return groups;
}

export default function DeadlineBoard({ deadlines, onLift }: DeadlineBoardProps) {
  const groups = groupBySeverity(deadlines);

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle size={32} />}
        title="NO DEADLINE EQUIPMENT"
        message="All equipment is operationally ready"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {groups.map((group) => (
        <div key={group.label}>
          {/* Group header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
            }}
          >
            <AlertTriangle size={12} style={{ color: group.color }} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '1.5px',
                color: group.color,
              }}
            >
              {group.label}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--color-text-muted)',
                marginLeft: 4,
              }}
            >
              ({group.items.length})
            </span>
          </div>

          {/* Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 10,
            }}
          >
            {group.items.map((deadline) => (
              <div
                key={deadline.id}
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderLeft: `3px solid ${REASON_COLORS[deadline.reason] || 'var(--color-text-muted)'}`,
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {/* Top row: bumper + days */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--color-text-bright)',
                      }}
                    >
                      {deadline.bumperNumber || '---'}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {deadline.nomenclature || '---'}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: group.color,
                    }}
                  >
                    {deadline.daysDeadlined ?? 0}d
                  </span>
                </div>

                {/* Reason badge */}
                <div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 8,
                      fontWeight: 600,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius)',
                      backgroundColor: `${REASON_COLORS[deadline.reason] || 'var(--color-text-muted)'}18`,
                      color: REASON_COLORS[deadline.reason] || 'var(--color-text-muted)',
                      border: `1px solid ${REASON_COLORS[deadline.reason] || 'var(--color-text-muted)'}40`,
                    }}
                  >
                    {getReasonLabel(deadline.reason)}
                  </span>
                </div>

                {/* Notes */}
                {deadline.notes && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.5,
                    }}
                  >
                    {deadline.notes}
                  </div>
                )}

                {/* Lift button */}
                {onLift && (
                  <button
                    onClick={() => onLift(deadline.id)}
                    style={{
                      alignSelf: 'flex-start',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 8,
                      fontWeight: 600,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--color-success)',
                      backgroundColor: 'transparent',
                      color: 'var(--color-success)',
                      cursor: 'pointer',
                      transition: 'all var(--transition)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    LIFT DEADLINE
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
