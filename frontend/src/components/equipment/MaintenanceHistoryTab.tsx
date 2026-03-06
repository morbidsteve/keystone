import { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench, Package, Clock, User, ExternalLink, Plus } from 'lucide-react';
import type { MaintenanceWorkOrder } from '@/lib/types';
import EmptyState from '@/components/ui/EmptyState';
import { WorkOrderStatus } from '@/lib/types';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import WorkOrderDetailModal from './WorkOrderDetailModal';
import CreateWorkOrderModal from './CreateWorkOrderModal';

interface MaintenanceHistoryTabProps {
  workOrders: MaintenanceWorkOrder[];
  equipmentId?: string;
  onRefresh?: () => void;
}

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
    case WorkOrderStatus.COMPLETE: return 'var(--color-success)';
    case WorkOrderStatus.IN_PROGRESS: return 'var(--color-warning)';
    case WorkOrderStatus.AWAITING_PARTS: return 'var(--color-danger)';
    case WorkOrderStatus.OPEN: return 'var(--color-text-muted)';
    default: return 'var(--color-text-muted)';
  }
}

function WorkOrderRow({ wo, onViewDetails }: { wo: MaintenanceWorkOrder; onViewDetails: (wo: MaintenanceWorkOrder) => void }) {
  const [expanded, setExpanded] = useState(false);
  const totalParts = wo.parts.length;
  const totalLabor = wo.laborEntries.reduce((sum, l) => sum + l.hours, 0);

  return (
    <div
      className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden" style={{ borderLeft: `3px solid ${getPriorityColor(wo.priority)}`, transition: 'background-color var(--transition)' }}
    >
      {/* Header Row */}
      <div
        className="flex items-center gap-2.5 py-2.5 px-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {expanded ? (
          <ChevronDown size={14} className="text-[var(--color-text-muted)] shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-[var(--color-text-muted)] shrink-0" />
        )}

        <span
          className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-bright)] font-semibold min-w-[100px]"
        >
          {wo.workOrderNumber}
        </span>

        <span
          className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px] min-w-[60px]" style={{ color: getPriorityColor(wo.priority) }}
        >
          {getPriorityLabel(wo.priority)}
        </span>

        <span
          className="text-[11px] text-[var(--color-text)] flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
        >
          {wo.description}
        </span>

        <span
          className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] flex items-center gap-1"
        >
          <Package size={9} />
          {totalParts}
        </span>

        <span
          className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] flex items-center gap-1"
        >
          <Clock size={9} />
          {totalLabor}h
        </span>

        <span
          className="font-[var(--font-mono)] text-[9px] py-0.5 px-2 rounded-[2px] tracking-[0.5px] whitespace-nowrap" style={{ border: `1px solid ${getWOStatusColor(wo.status)}`, color: getWOStatusColor(wo.status), backgroundColor: `${getWOStatusColor(wo.status)}15` }}
        >
          {wo.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div
          className="border-t border-t-[var(--color-border)] py-3 px-4 flex flex-col gap-4"
        >
          {/* Meta Info */}
          <div
            className="flex gap-6 font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] flex-wrap"
          >
            <span>Created: {formatDate(wo.createdAt)}</span>
            {wo.completedAt && <span>Completed: {formatDate(wo.completedAt)}</span>}
            {wo.estimatedCompletion && (
              <span>ETA: {formatRelativeTime(wo.estimatedCompletion)}</span>
            )}
            {wo.assignedTo && (
              <span className="flex items-center gap-[3px]">
                <User size={9} />
                {wo.assignedTo}
              </span>
            )}
            {wo.location && <span>Location: {wo.location}</span>}
            {wo.category && <span>Category: {wo.category}</span>}
          </div>

          {/* Parts Table */}
          {wo.parts.length > 0 && (
            <div>
              <div
                className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5"
              >
                <Package size={10} />
                PARTS ({wo.parts.length})
              </div>
              <div
                className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden"
              >
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['PART #', 'NOMENCLATURE', 'QTY', 'SOURCE', 'STATUS', 'COST'].map((h) => (
                        <th
                          key={h}
                          className="font-[var(--font-mono)] text-[9px] font-semibold text-[var(--color-text-muted)] py-1.5 px-2.5 border-b border-b-[var(--color-border)] tracking-[1px]" style={{ textAlign: h === 'QTY' || h === 'COST' ? 'right' : 'left' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {wo.parts.map((part) => (
                      <tr key={part.id}>
                        <td
                          className="font-[var(--font-mono)] text-[10px] py-1.5 px-2.5 text-[var(--color-text-bright)] border-b border-b-[var(--color-border)]"
                        >
                          {part.partNumber}
                        </td>
                        <td
                          className="text-[10px] py-1.5 px-2.5 text-[var(--color-text)] border-b border-b-[var(--color-border)]"
                        >
                          {part.nomenclature}
                        </td>
                        <td
                          className="font-[var(--font-mono)] text-[10px] py-1.5 px-2.5 text-right text-[var(--color-text)] border-b border-b-[var(--color-border)]"
                        >
                          {part.quantity}
                        </td>
                        <td
                          className="font-[var(--font-mono)] text-[9px] py-1.5 px-2.5 text-[var(--color-text-muted)] border-b border-b-[var(--color-border)]"
                        >
                          {part.source.replace(/_/g, ' ')}
                        </td>
                        <td
                          className="font-[var(--font-mono)] text-[9px] py-1.5 px-2.5 border-b border-b-[var(--color-border)]" style={{ color: part.status === 'INSTALLED'
                                ? 'var(--color-success)'
                                : part.status === 'ON_ORDER'
                                  ? 'var(--color-warning)'
                                  : 'var(--color-text-muted)' }}
                        >
                          {part.status.replace(/_/g, ' ')}
                        </td>
                        <td
                          className="font-[var(--font-mono)] text-[10px] py-1.5 px-2.5 text-right text-[var(--color-text)] border-b border-b-[var(--color-border)]"
                        >
                          {part.unitCost ? `$${(part.unitCost * part.quantity).toLocaleString()}` : '\u2014'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Labor Table */}
          {wo.laborEntries.length > 0 && (
            <div>
              <div
                className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5"
              >
                <Wrench size={10} />
                LABOR ({wo.laborEntries.length} entries, {totalLabor}h total)
              </div>
              <div
                className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden"
              >
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['DATE', 'TYPE', 'HOURS', 'NOTES'].map((h) => (
                        <th
                          key={h}
                          className="font-[var(--font-mono)] text-[9px] font-semibold text-[var(--color-text-muted)] py-1.5 px-2.5 border-b border-b-[var(--color-border)] tracking-[1px]" style={{ textAlign: h === 'HOURS' ? 'right' : 'left' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {wo.laborEntries.map((labor) => (
                      <tr key={labor.id}>
                        <td
                          className="font-[var(--font-mono)] text-[10px] py-1.5 px-2.5 text-[var(--color-text)] border-b border-b-[var(--color-border)] whitespace-nowrap"
                        >
                          {labor.date}
                        </td>
                        <td
                          className="font-[var(--font-mono)] text-[9px] py-1.5 px-2.5 text-[var(--color-text-muted)] border-b border-b-[var(--color-border)] uppercase"
                        >
                          {labor.laborType}
                        </td>
                        <td
                          className="font-[var(--font-mono)] text-[10px] py-1.5 px-2.5 text-right text-[var(--color-text-bright)] font-semibold border-b border-b-[var(--color-border)]"
                        >
                          {labor.hours}h
                        </td>
                        <td
                          className="text-[10px] py-1.5 px-2.5 text-[var(--color-text)] border-b border-b-[var(--color-border)]"
                        >
                          {labor.notes || '\u2014'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* View Full Details Button */}
          <div className="flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(wo);
              }}
              className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px] py-1.5 px-4 border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-bg-hover)] text-[var(--color-text-bright)] cursor-pointer flex items-center gap-1.5 transition-colors duration-[var(--transition)]"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
            >
              <ExternalLink size={10} />
              VIEW FULL DETAILS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MaintenanceHistoryTab({ workOrders, equipmentId, onRefresh }: MaintenanceHistoryTabProps) {
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date');
  const [modalWO, setModalWO] = useState<MaintenanceWorkOrder | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const sorted = [...workOrders].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        return a.priority - b.priority;
      case 'status': {
        const statusOrder = { OPEN: 0, IN_PROGRESS: 1, AWAITING_PARTS: 2, COMPLETE: 3 };
        return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
      }
      case 'date':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const openCount = workOrders.filter(
    (wo) => wo.status !== WorkOrderStatus.COMPLETE,
  ).length;
  const totalHours = workOrders.reduce(
    (sum, wo) => sum + (wo.actualHours || wo.laborEntries.reduce((s, l) => s + l.hours, 0)),
    0,
  );

  const handleUpdate = () => {
    setModalWO(null);
    onRefresh?.();
  };

  const handleCreate = () => {
    onRefresh?.();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Summary Bar */}
      <div
        className="flex gap-6 py-3 px-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] items-center flex-wrap"
      >
        <div>
          <div
            className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] uppercase tracking-[1px]"
          >
            Total WOs
          </div>
          <div
            className="font-[var(--font-mono)] text-lg font-semibold text-[var(--color-text-bright)]"
          >
            {workOrders.length}
          </div>
        </div>
        <div>
          <div
            className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] uppercase tracking-[1px]"
          >
            Open
          </div>
          <div
            className="font-[var(--font-mono)] text-lg font-semibold" style={{ color: openCount > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}
          >
            {openCount}
          </div>
        </div>
        <div>
          <div
            className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] uppercase tracking-[1px]"
          >
            Total Hours
          </div>
          <div
            className="font-[var(--font-mono)] text-lg font-semibold text-[var(--color-text-bright)]"
          >
            {totalHours.toFixed(1)}
          </div>
        </div>

        {/* NEW WO Button + Sort Controls */}
        <div className="flex gap-1.5 items-center ml-auto">
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1 font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px] py-1 px-2.5 border border-[var(--color-accent)] rounded-[var(--radius)] bg-transparent text-[var(--color-accent)] cursor-pointer uppercase"
          >
            <Plus size={10} />
            NEW WO
          </button>
          <div className="w-[1px] h-[20px] bg-[var(--color-border)] mx-1" />
          {(['date', 'priority', 'status'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className="font-[var(--font-mono)] text-[9px] py-1 px-2.5 rounded-[var(--radius)] cursor-pointer uppercase tracking-[1px]" style={{ border: `1px solid ${sortBy === s ? 'var(--color-text-bright)' : 'var(--color-border)'}`, backgroundColor: sortBy === s ? 'var(--color-bg-hover)' : 'transparent', color: sortBy === s ? 'var(--color-text-bright)' : 'var(--color-text-muted)' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Work Order List */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={<Wrench size={32} />}
          title="NO WORK ORDERS"
          message="No maintenance work orders found for this equipment"
          actionLabel="+ NEW WORK ORDER"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        sorted.map((wo) => (
          <WorkOrderRow key={wo.id} wo={wo} onViewDetails={setModalWO} />
        ))
      )}

      <WorkOrderDetailModal
        workOrder={modalWO}
        onClose={() => setModalWO(null)}
        onUpdate={handleUpdate}
      />

      <CreateWorkOrderModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
        defaultEquipmentId={equipmentId}
      />
    </div>
  );
}
