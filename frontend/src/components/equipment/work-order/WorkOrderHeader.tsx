import { X } from 'lucide-react';
import type { MaintenanceWorkOrder } from './types';
import { getStatusColor, getPriorityLabel, getPriorityColor, badgeStyle } from './types';

interface WorkOrderHeaderProps {
  wo: MaintenanceWorkOrder;
  onClose: () => void;
}

export default function WorkOrderHeader({ wo, onClose }: WorkOrderHeaderProps) {
  return (
    <div
      className="flex justify-between items-center py-3.5 px-4 border-b border-b-[var(--color-border)]"
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <span
          className="font-[var(--font-mono)] text-sm font-bold tracking-[1.5px] text-[var(--color-text-bright)]"
        >
          {wo.workOrderNumber}
        </span>
        <span style={badgeStyle(getStatusColor(wo.status))}>
          {wo.status.replace(/_/g, ' ')}
        </span>
        <span style={badgeStyle(getPriorityColor(wo.priority))}>
          {getPriorityLabel(wo.priority)}
        </span>
        {wo.category && (
          <span style={badgeStyle('var(--color-text-muted)')}>
            {wo.category}
          </span>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex items-center justify-center bg-transparent border-0 text-[var(--color-text-muted)] cursor-pointer p-1"
      >
        <X size={16} />
      </button>
    </div>
  );
}
