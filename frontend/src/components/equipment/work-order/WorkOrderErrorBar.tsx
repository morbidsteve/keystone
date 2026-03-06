import { AlertTriangle, X } from 'lucide-react';
import { smallBtnStyle } from './types';

interface WorkOrderErrorBarProps {
  error: string;
  onDismiss: () => void;
}

export default function WorkOrderErrorBar({ error, onDismiss }: WorkOrderErrorBarProps) {
  return (
    <div
      className="flex items-center gap-2 py-2 px-4 bg-[var(--color-danger)15] border-b border-b-[var(--color-danger)] font-[var(--font-mono)] text-[11px] text-[var(--color-danger)]"
    >
      <AlertTriangle size={12} />
      {error}
      <button
        onClick={onDismiss}
        className="text-[var(--color-danger)]"
      >
        <X size={12} />
      </button>
    </div>
  );
}
