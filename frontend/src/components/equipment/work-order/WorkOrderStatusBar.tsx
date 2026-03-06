import { WorkOrderStatus } from './types';
import { actionBtnStyle } from './types';

interface StatusTransition {
  label: string;
  target: WorkOrderStatus;
}

interface WorkOrderStatusBarProps {
  transitions: StatusTransition[];
  statusLoading: boolean;
  onStatusChange: (target: WorkOrderStatus) => void;
}

export default function WorkOrderStatusBar({
  transitions,
  statusLoading,
  onStatusChange,
}: WorkOrderStatusBarProps) {
  if (transitions.length === 0) return null;

  return (
    <div
      className="flex gap-2 py-2.5 px-4 border-b border-b-[var(--color-border)] bg-[var(--color-bg-elevated)] items-center flex-wrap"
    >
      <span
        className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] uppercase mr-1"
      >
        TRANSITION:
      </span>
      {transitions.map((t) => (
        <button
          key={t.target}
          disabled={statusLoading}
          onClick={() => onStatusChange(t.target)}
          style={actionBtnStyle(
            t.target === WorkOrderStatus.COMPLETE
              ? 'var(--color-success)'
              : t.target === WorkOrderStatus.OPEN
                ? 'var(--color-warning)'
                : 'var(--color-accent)',
            'var(--color-bg)',
            statusLoading,
          )}
        >
          {statusLoading ? 'UPDATING...' : t.label}
        </button>
      ))}
    </div>
  );
}
