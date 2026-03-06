import { useState, useEffect, useCallback } from 'react';
import { Wrench, Clock, Package, Plus } from 'lucide-react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import StatusDot from '@/components/ui/StatusDot';
import { formatRelativeTime } from '@/lib/utils';
import type { MaintenanceWorkOrder } from '@/lib/types';
import { WorkOrderStatus } from '@/lib/types';
import { getWorkOrders } from '@/api/maintenance';
import { useDashboardStore } from '@/stores/dashboardStore';
import WorkOrderDetailModal from './WorkOrderDetailModal';
import CreateWorkOrderModal from './CreateWorkOrderModal';

function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1: return 'URGENT';
    case 2: return 'PRIORITY';
    case 3: return 'ROUTINE';
    default: return 'ROUTINE';
  }
}

function getPriorityColor(priority: number): string {
  switch (priority) {
    case 1: return 'var(--color-danger)';
    case 2: return 'var(--color-warning)';
    default: return 'var(--color-text-muted)';
  }
}

function getWOStatusColor(status: WorkOrderStatus): string {
  switch (status) {
    case WorkOrderStatus.COMPLETE: return 'GREEN';
    case WorkOrderStatus.IN_PROGRESS: return 'AMBER';
    case WorkOrderStatus.AWAITING_PARTS: return 'RED';
    case WorkOrderStatus.OPEN: return 'AMBER';
    default: return 'AMBER';
  }
}

export default function MaintenanceQueue() {
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrder[]>([]);
  const [selectedWO, setSelectedWO] = useState<MaintenanceWorkOrder | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);

  const loadWorkOrders = useCallback(async () => {
    try {
      const result = await getWorkOrders({ unitId: selectedUnitId ?? undefined });
      // Show only non-complete work orders in the queue
      const openOrders = result.data.filter(
        (wo) => wo.status !== WorkOrderStatus.COMPLETE,
      );
      setWorkOrders(openOrders);
    } catch (err) {
      console.error('Failed to load work orders:', err);
    }
  }, [selectedUnitId]);

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  const handleUpdate = () => {
    loadWorkOrders();
    // If the selected WO was updated, refresh it from the reloaded list
    setSelectedWO(null);
  };

  const handleCreate = () => {
    loadWorkOrders();
  };

  return (
    <Card
      title="MAINTENANCE WORK ORDERS"
      headerRight={
        <div className="flex items-center gap-2.5">
          <span
            className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]"
          >
            {workOrders.length} OPEN
          </span>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1 font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px] py-1 px-2.5 border border-[var(--color-accent)] rounded-[var(--radius)] bg-transparent text-[var(--color-accent)] cursor-pointer uppercase"
          >
            <Plus size={10} />
            NEW WO
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-1.5">
        {workOrders.length === 0 && (
          <EmptyState
            icon={<Wrench size={32} />}
            title="NO WORK ORDERS"
            message="Create a work order to track maintenance tasks"
            actionLabel="+ NEW WORK ORDER"
            onAction={() => setShowCreate(true)}
          />
        )}
        {workOrders.map((wo) => {
          const totalLabor = wo.laborEntries.reduce((sum, l) => sum + l.hours, 0);
          return (
            <div
              key={wo.id}
              className="flex items-start gap-2.5 py-2.5 px-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius)] cursor-pointer" style={{ borderLeft: `3px solid ${getPriorityColor(wo.priority)}`, transition: 'background-color var(--transition)' }}
              onClick={() => setSelectedWO(wo)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)')}
            >
              <Wrench size={14} className="text-[var(--color-text-muted)] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-bright)] font-semibold"
                    >
                      {wo.workOrderNumber}
                    </span>
                    <span
                      className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px]" style={{ color: getPriorityColor(wo.priority) }}
                    >
                      {getPriorityLabel(wo.priority)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={getWOStatusColor(wo.status)} size={6} />
                    <span
                      className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[0.5px]"
                    >
                      {wo.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div
                  className="text-[11px] text-[var(--color-text-muted)] mb-1"
                >
                  {wo.description || '---'}
                </div>
                <div
                  className="flex gap-3 font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mb-1"
                >
                  <span>{wo.workOrderNumber}</span>
                  <span>{wo.unitId}</span>
                  <span className="flex items-center gap-[3px]">
                    <Clock size={9} />
                    {formatRelativeTime(wo.createdAt)}
                  </span>
                  {wo.estimatedCompletion && (
                    <span>ETA: {formatRelativeTime(wo.estimatedCompletion)}</span>
                  )}
                </div>
                <div
                  className="flex gap-3 font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
                >
                  <span className="flex items-center gap-[3px]">
                    <Package size={9} />
                    {wo.parts.length} {wo.parts.length === 1 ? 'part' : 'parts'}
                  </span>
                  <span className="flex items-center gap-[3px]">
                    <Clock size={9} />
                    {totalLabor}h labor
                  </span>
                  {wo.assignedTo && (
                    <span>{wo.assignedTo}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <WorkOrderDetailModal
        workOrder={selectedWO}
        onClose={() => setSelectedWO(null)}
        onUpdate={handleUpdate}
      />

      <CreateWorkOrderModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </Card>
  );
}
