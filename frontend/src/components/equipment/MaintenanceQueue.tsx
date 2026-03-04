import { useState, useEffect, useCallback } from 'react';
import { Wrench, Clock, Package, Plus } from 'lucide-react';
import Card from '@/components/ui/Card';
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-muted)',
            }}
          >
            {workOrders.length} OPEN
          </span>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '1px',
              padding: '4px 10px',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'transparent',
              color: 'var(--color-accent)',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            <Plus size={10} />
            NEW WO
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {workOrders.map((wo) => {
          const totalLabor = wo.laborEntries.reduce((sum, l) => sum + l.hours, 0);
          return (
            <div
              key={wo.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 12px',
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderLeft: `3px solid ${getPriorityColor(wo.priority)}`,
                borderRadius: 'var(--radius)',
                transition: 'background-color var(--transition)',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedWO(wo)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)')}
            >
              <Wrench size={14} style={{ color: 'var(--color-text-muted)', marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--color-text-bright)',
                        fontWeight: 600,
                      }}
                    >
                      {wo.workOrderNumber}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: getPriorityColor(wo.priority),
                        fontWeight: 600,
                        letterSpacing: '1px',
                      }}
                    >
                      {getPriorityLabel(wo.priority)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StatusDot status={getWOStatusColor(wo.status)} size={6} />
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'var(--color-text-muted)',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {wo.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    marginBottom: 4,
                  }}
                >
                  {wo.description || '---'}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                    marginBottom: 4,
                  }}
                >
                  <span>{wo.workOrderNumber}</span>
                  <span>{wo.unitId}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={9} />
                    {formatRelativeTime(wo.createdAt)}
                  </span>
                  {wo.estimatedCompletion && (
                    <span>ETA: {formatRelativeTime(wo.estimatedCompletion)}</span>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Package size={9} />
                    {wo.parts.length} {wo.parts.length === 1 ? 'part' : 'parts'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
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
