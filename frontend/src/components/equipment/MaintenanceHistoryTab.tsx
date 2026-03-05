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
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${getPriorityColor(wo.priority)}`,
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        transition: 'background-color var(--transition)',
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {expanded ? (
          <ChevronDown size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        ) : (
          <ChevronRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        )}

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-bright)',
            fontWeight: 600,
            minWidth: 100,
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
            minWidth: 60,
          }}
        >
          {getPriorityLabel(wo.priority)}
        </span>

        <span
          style={{
            fontSize: 11,
            color: 'var(--color-text)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {wo.description}
        </span>

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Package size={9} />
          {totalParts}
        </span>

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Clock size={9} />
          {totalLabor}h
        </span>

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            padding: '2px 8px',
            borderRadius: 2,
            border: `1px solid ${getWOStatusColor(wo.status)}`,
            color: getWOStatusColor(wo.status),
            backgroundColor: `${getWOStatusColor(wo.status)}15`,
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
          }}
        >
          {wo.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Meta Info */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-muted)',
              flexWrap: 'wrap',
            }}
          >
            <span>Created: {formatDate(wo.createdAt)}</span>
            {wo.completedAt && <span>Completed: {formatDate(wo.completedAt)}</span>}
            {wo.estimatedCompletion && (
              <span>ETA: {formatRelativeTime(wo.estimatedCompletion)}</span>
            )}
            {wo.assignedTo && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
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
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: 'var(--color-text-muted)',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Package size={10} />
                PARTS ({wo.parts.length})
              </div>
              <div
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['PART #', 'NOMENCLATURE', 'QTY', 'SOURCE', 'STATUS', 'COST'].map((h) => (
                        <th
                          key={h}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            fontWeight: 600,
                            color: 'var(--color-text-muted)',
                            padding: '6px 10px',
                            textAlign: h === 'QTY' || h === 'COST' ? 'right' : 'left',
                            borderBottom: '1px solid var(--color-border)',
                            letterSpacing: '1px',
                          }}
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
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            padding: '6px 10px',
                            color: 'var(--color-text-bright)',
                            borderBottom: '1px solid var(--color-border)',
                          }}
                        >
                          {part.partNumber}
                        </td>
                        <td
                          style={{
                            fontSize: 10,
                            padding: '6px 10px',
                            color: 'var(--color-text)',
                            borderBottom: '1px solid var(--color-border)',
                          }}
                        >
                          {part.nomenclature}
                        </td>
                        <td
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            padding: '6px 10px',
                            textAlign: 'right',
                            color: 'var(--color-text)',
                            borderBottom: '1px solid var(--color-border)',
                          }}
                        >
                          {part.quantity}
                        </td>
                        <td
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            padding: '6px 10px',
                            color: 'var(--color-text-muted)',
                            borderBottom: '1px solid var(--color-border)',
                          }}
                        >
                          {part.source.replace(/_/g, ' ')}
                        </td>
                        <td
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            padding: '6px 10px',
                            color:
                              part.status === 'INSTALLED'
                                ? 'var(--color-success)'
                                : part.status === 'ON_ORDER'
                                  ? 'var(--color-warning)'
                                  : 'var(--color-text-muted)',
                            borderBottom: '1px solid var(--color-border)',
                          }}
                        >
                          {part.status.replace(/_/g, ' ')}
                        </td>
                        <td
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            padding: '6px 10px',
                            textAlign: 'right',
                            color: 'var(--color-text)',
                            borderBottom: '1px solid var(--color-border)',
                          }}
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
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: 'var(--color-text-muted)',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Wrench size={10} />
                LABOR ({wo.laborEntries.length} entries, {totalLabor}h total)
              </div>
              <div
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['DATE', 'TYPE', 'HOURS', 'NOTES'].map((h) => (
                        <th
                          key={h}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            fontWeight: 600,
                            color: 'var(--color-text-muted)',
                            padding: '6px 10px',
                            textAlign: h === 'HOURS' ? 'right' : 'left',
                            borderBottom: '1px solid var(--color-border)',
                            letterSpacing: '1px',
                          }}
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
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            padding: '6px 10px',
                            color: 'var(--color-text)',
                            borderBottom: '1px solid var(--color-border)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {labor.date}
                        </td>
                        <td
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            padding: '6px 10px',
                            color: 'var(--color-text-muted)',
                            borderBottom: '1px solid var(--color-border)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {labor.laborType}
                        </td>
                        <td
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            padding: '6px 10px',
                            textAlign: 'right',
                            color: 'var(--color-text-bright)',
                            fontWeight: 600,
                            borderBottom: '1px solid var(--color-border)',
                          }}
                        >
                          {labor.hours}h
                        </td>
                        <td
                          style={{
                            fontSize: 10,
                            padding: '6px 10px',
                            color: 'var(--color-text)',
                            borderBottom: '1px solid var(--color-border)',
                          }}
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
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(wo);
              }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '1px',
                padding: '6px 16px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-bg-hover)',
                color: 'var(--color-text-bright)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background-color var(--transition)',
              }}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary Bar */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          padding: '12px 16px',
          backgroundColor: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Total WOs
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--color-text-bright)',
            }}
          >
            {workOrders.length}
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Open
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 18,
              fontWeight: 600,
              color: openCount > 0 ? 'var(--color-warning)' : 'var(--color-success)',
            }}
          >
            {openCount}
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Total Hours
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--color-text-bright)',
            }}
          >
            {totalHours.toFixed(1)}
          </div>
        </div>

        {/* NEW WO Button + Sort Controls */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
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
          <div style={{ width: 1, height: 20, backgroundColor: 'var(--color-border)', margin: '0 4px' }} />
          {(['date', 'priority', 'status'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                padding: '4px 10px',
                border: `1px solid ${sortBy === s ? 'var(--color-text-bright)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius)',
                backgroundColor: sortBy === s ? 'var(--color-bg-hover)' : 'transparent',
                color: sortBy === s ? 'var(--color-text-bright)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
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
