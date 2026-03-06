import { Trash2, AlertTriangle, RotateCcw } from 'lucide-react';
import type { MaintenanceWorkOrder } from './types';
import { actionBtnStyle, smallBtnStyle } from './types';

interface WorkOrderHistoryProps {
  wo: MaintenanceWorkOrder;
  deleteConfirm: boolean;
  isDeleting: boolean;
  onDeleteConfirm: (v: boolean) => void;
  onDelete: () => void;
}

export default function WorkOrderHistory({
  wo,
  deleteConfirm,
  isDeleting,
  onDeleteConfirm,
  onDelete,
}: WorkOrderHistoryProps) {
  return (
    <div
      className="mt-3 py-3 px-4 border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-bg-elevated)]"
    >
      {!deleteConfirm ? (
        <button
          onClick={() => onDeleteConfirm(true)}
          className="flex items-center gap-1.5"
        >
          <Trash2 size={10} />
          DELETE WORK ORDER
        </button>
      ) : (
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className="font-[var(--font-mono)] text-[10px] text-[var(--color-danger)] font-semibold flex items-center gap-1.5"
          >
            <AlertTriangle size={12} />
            PERMANENTLY DELETE {wo.workOrderNumber}?
          </span>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            style={actionBtnStyle('var(--color-danger)', '#fff', isDeleting)}
          >
            {isDeleting ? 'DELETING...' : 'CONFIRM DELETE'}
          </button>
          <button
            onClick={() => onDeleteConfirm(false)}
            disabled={isDeleting}
            style={{
              ...smallBtnStyle,
              border: '1px solid var(--color-border)',
            }}
          >
            <RotateCcw size={10} />
          </button>
        </div>
      )}
    </div>
  );
}
