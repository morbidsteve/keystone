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
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.label}>
          {/* Group header */}
          <div
            className="flex items-center gap-2 mb-2.5"
          >
            <AlertTriangle size={12} style={{ color: group.color }} />
            <span
              className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[1.5px]" style={{ color: group.color }}
            >
              {group.label}
            </span>
            <span
              className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] ml-1"
            >
              ({group.items.length})
            </span>
          </div>

          {/* Cards */}
          <div
            className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]"
          >
            {group.items.map((deadline) => (
              <div
                key={deadline.id}
                className="py-3 px-3.5 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius)] flex flex-col gap-2" style={{ borderLeft: `3px solid ${REASON_COLORS[deadline.reason] || 'var(--color-text-muted)'}` }}
              >
                {/* Top row: bumper + days */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-[var(--font-mono)] text-[13px] font-bold text-[var(--color-text-bright)]"
                    >
                      {deadline.bumperNumber || '---'}
                    </span>
                    <span
                      className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]"
                    >
                      {deadline.nomenclature || '---'}
                    </span>
                  </div>
                  <span
                    className="font-[var(--font-mono)] text-[11px] font-bold" style={{ color: group.color }}
                  >
                    {deadline.daysDeadlined ?? 0}d
                  </span>
                </div>

                {/* Reason badge */}
                <div>
                  <span
                    className="font-[var(--font-mono)] text-[8px] font-semibold tracking-[1px] uppercase py-0.5 px-2 rounded-[var(--radius)]" style={{ backgroundColor: `${REASON_COLORS[deadline.reason] || 'var(--color-text-muted)'}18`, color: REASON_COLORS[deadline.reason] || 'var(--color-text-muted)', border: `1px solid ${REASON_COLORS[deadline.reason] || 'var(--color-text-muted)'}40` }}
                  >
                    {getReasonLabel(deadline.reason)}
                  </span>
                </div>

                {/* Notes */}
                {deadline.notes && (
                  <div
                    className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] leading-normal"
                  >
                    {deadline.notes}
                  </div>
                )}

                {/* Lift button */}
                {onLift && (
                  <button
                    onClick={() => onLift(deadline.id)}
                    className="self-start font-[var(--font-mono)] text-[8px] font-semibold tracking-[1px] uppercase py-1 px-2.5 rounded-[var(--radius)] border border-[var(--color-success)] bg-transparent text-[var(--color-success)] cursor-pointer transition-all duration-[var(--transition)]"
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
