import type { MaintenanceWorkOrder } from '@/lib/types';
import { useWorkOrderState } from './work-order/useWorkOrderState';
import WorkOrderHeader from './work-order/WorkOrderHeader';
import WorkOrderStatusBar from './work-order/WorkOrderStatusBar';
import WorkOrderErrorBar from './work-order/WorkOrderErrorBar';
import WorkOrderInfo from './work-order/WorkOrderInfo';
import WorkOrderParts from './work-order/WorkOrderParts';
import WorkOrderLabor from './work-order/WorkOrderLabor';
import WorkOrderHistory from './work-order/WorkOrderHistory';

interface WorkOrderDetailModalProps {
  workOrder: MaintenanceWorkOrder | null;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function WorkOrderDetailModal({ workOrder, onClose, onUpdate }: WorkOrderDetailModalProps) {
  const state = useWorkOrderState(workOrder, onClose, onUpdate);
  const { wo } = state;

  if (!wo) return null;

  return (
    <div
      className="fixed z-[3000] flex items-center justify-center bg-[rgba(0,0,0,0.85)] inset-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-[90%] max-w-[860px] max-h-[90vh] bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-[var(--radius)] flex flex-col overflow-hidden"
      >
        <WorkOrderHeader wo={wo} onClose={onClose} />

        <WorkOrderStatusBar
          transitions={state.transitions}
          statusLoading={state.statusLoading}
          onStatusChange={state.handleStatusChange}
        />

        {state.error && (
          <WorkOrderErrorBar
            error={state.error}
            onDismiss={() => state.setError(null)}
          />
        )}

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto flex flex-col gap-5" style={{ padding: '16px' }}
        >
          <WorkOrderInfo
            wo={wo}
            totalLaborHours={state.totalLaborHours}
            editMode={state.editMode}
            editSaving={state.editSaving}
            editDescription={state.editDescription}
            editPriority={state.editPriority}
            editAssignedTo={state.editAssignedTo}
            editLocation={state.editLocation}
            editCategory={state.editCategory}
            editEstCompletion={state.editEstCompletion}
            onEditDescription={state.setEditDescription}
            onEditPriority={state.setEditPriority}
            onEditAssignedTo={state.setEditAssignedTo}
            onEditLocation={state.setEditLocation}
            onEditCategory={state.setEditCategory}
            onEditEstCompletion={state.setEditEstCompletion}
            onStartEdit={state.startEdit}
            onSaveEdit={state.handleSaveEdit}
            onCancelEdit={state.cancelEdit}
          />

          <WorkOrderParts
            wo={wo}
            totalPartsCost={state.totalPartsCost}
            addingPart={state.addingPart}
            editingPartId={state.editingPartId}
            partForm={state.partForm}
            partSaving={state.partSaving}
            onPartFormChange={state.setPartForm}
            onStartAdd={state.startAddPart}
            onStartEdit={state.startEditPart}
            onSave={state.handleSavePart}
            onCancelAdd={state.cancelAddPart}
            onCancelEdit={state.cancelEditPart}
            onDelete={state.handleDeletePart}
          />

          <WorkOrderLabor
            wo={wo}
            totalLaborHours={state.totalLaborHours}
            addingLabor={state.addingLabor}
            editingLaborId={state.editingLaborId}
            laborForm={state.laborForm}
            laborSaving={state.laborSaving}
            onLaborFormChange={state.setLaborForm}
            onStartAdd={state.startAddLabor}
            onStartEdit={state.startEditLabor}
            onSave={state.handleSaveLabor}
            onCancelAdd={state.cancelAddLabor}
            onCancelEdit={state.cancelEditLabor}
            onDelete={state.handleDeleteLabor}
          />

          <WorkOrderHistory
            wo={wo}
            deleteConfirm={state.deleteConfirm}
            isDeleting={state.isDeleting}
            onDeleteConfirm={state.setDeleteConfirm}
            onDelete={state.handleDelete}
          />
        </div>

        {/* Footer */}
        <div
          className="flex justify-end py-3 px-4 border-t border-t-[var(--color-border)]"
        >
          <button
            onClick={onClose}
            className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] py-2 px-6 border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-bg-hover)] text-[var(--color-text-bright)] cursor-pointer transition-colors duration-[var(--transition)]"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
