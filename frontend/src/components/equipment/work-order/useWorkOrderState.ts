import { useState, useEffect, useCallback } from 'react';
import type { MaintenanceWorkOrder, MaintenancePart, MaintenanceLabor, WorkOrderCategory } from './types';
import { WorkOrderStatus, WOCat, PartSource, PartStatus, LaborType } from './types';
import {
  updateWorkOrder,
  deleteWorkOrder,
  addPart,
  updatePart,
  deletePart,
  addLabor,
  updateLabor,
  deleteLabor,
} from '@/api/maintenance';
import type { PartFormData } from './WorkOrderParts';
import type { LaborFormData } from './WorkOrderLabor';

const INITIAL_PART_FORM: PartFormData = {
  partNumber: '',
  nsn: '',
  nomenclature: '',
  quantity: 1,
  unitCost: 0,
  source: PartSource.ON_HAND,
  status: PartStatus.NEEDED,
};

const INITIAL_LABOR_FORM: LaborFormData = {
  personnelId: '',
  laborType: LaborType.REPAIR,
  hours: 0,
  date: new Date().toISOString().split('T')[0],
  notes: '',
};

export function useWorkOrderState(
  workOrder: MaintenanceWorkOrder | null,
  onClose: () => void,
  onUpdate?: () => void,
) {
  // ----- ESC to close -----
  useEffect(() => {
    if (!workOrder) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [workOrder, onClose]);

  // ----- Core state -----
  const [wo, setWo] = useState<MaintenanceWorkOrder | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit fields
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState(3);
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCategory, setEditCategory] = useState<WorkOrderCategory>(WOCat.CORRECTIVE);
  const [editEstCompletion, setEditEstCompletion] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Parts inline
  const [addingPart, setAddingPart] = useState(false);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [partForm, setPartForm] = useState<PartFormData>(INITIAL_PART_FORM);
  const [partSaving, setPartSaving] = useState(false);

  // Labor inline
  const [addingLabor, setAddingLabor] = useState(false);
  const [editingLaborId, setEditingLaborId] = useState<string | null>(null);
  const [laborForm, setLaborForm] = useState<LaborFormData>(INITIAL_LABOR_FORM);
  const [laborSaving, setLaborSaving] = useState(false);

  // Sync workOrder prop -> local state
  if (workOrder && (!wo || wo.id !== workOrder.id)) {
    setWo(workOrder);
    setEditMode(false);
    setError(null);
    setDeleteConfirm(false);
    setAddingPart(false);
    setEditingPartId(null);
    setAddingLabor(false);
    setEditingLaborId(null);
  }
  if (!workOrder && wo) {
    setWo(null);
  }

  // Derived
  const totalLaborHours = wo ? wo.laborEntries.reduce((sum, l) => sum + l.hours, 0) : 0;
  const totalPartsCost = wo ? wo.parts.reduce((sum, p) => sum + (p.unitCost ? p.unitCost * p.quantity : 0), 0) : 0;

  // ---------- Status transitions ----------
  const getTransitions = useCallback((): { label: string; target: WorkOrderStatus }[] => {
    if (!wo) return [];
    switch (wo.status) {
      case WorkOrderStatus.OPEN:
        return [{ label: 'START WORK', target: WorkOrderStatus.IN_PROGRESS }];
      case WorkOrderStatus.IN_PROGRESS:
        return [
          { label: 'AWAITING PARTS', target: WorkOrderStatus.AWAITING_PARTS },
          { label: 'COMPLETE', target: WorkOrderStatus.COMPLETE },
        ];
      case WorkOrderStatus.AWAITING_PARTS:
        return [
          { label: 'RESUME WORK', target: WorkOrderStatus.IN_PROGRESS },
          { label: 'COMPLETE', target: WorkOrderStatus.COMPLETE },
        ];
      case WorkOrderStatus.COMPLETE:
        return [{ label: 'REOPEN', target: WorkOrderStatus.OPEN }];
      default:
        return [];
    }
  }, [wo]);

  const handleStatusChange = useCallback(async (target: WorkOrderStatus) => {
    if (!wo) return;
    setStatusLoading(true);
    setError(null);
    try {
      const updated = await updateWorkOrder(wo.id, {
        status: target,
        ...(target === WorkOrderStatus.COMPLETE ? { completedAt: new Date().toISOString() } : {}),
      });
      setWo(updated);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setStatusLoading(false);
    }
  }, [wo, onUpdate]);

  // ---------- Edit WO fields ----------
  const startEdit = useCallback(() => {
    if (!wo) return;
    setEditDescription(wo.description || '');
    setEditPriority(wo.priority);
    setEditAssignedTo(wo.assignedTo || '');
    setEditLocation(wo.location || '');
    setEditCategory(wo.category || WOCat.CORRECTIVE);
    setEditEstCompletion(wo.estimatedCompletion ? wo.estimatedCompletion.split('T')[0] : '');
    setEditMode(true);
  }, [wo]);

  const handleSaveEdit = useCallback(async () => {
    if (!wo) return;
    setEditSaving(true);
    setError(null);
    try {
      const updated = await updateWorkOrder(wo.id, {
        description: editDescription,
        priority: editPriority,
        assignedTo: editAssignedTo || undefined,
        location: editLocation || undefined,
        category: editCategory,
        estimatedCompletion: editEstCompletion || undefined,
      });
      setWo(updated);
      setEditMode(false);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setEditSaving(false);
    }
  }, [wo, editDescription, editPriority, editAssignedTo, editLocation, editCategory, editEstCompletion, onUpdate]);

  // ---------- Delete WO ----------
  const handleDelete = useCallback(async () => {
    if (!wo) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteWorkOrder(wo.id);
      onUpdate?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete work order.');
    } finally {
      setIsDeleting(false);
    }
  }, [wo, onUpdate, onClose]);

  // ---------- Parts CRUD ----------
  const resetPartForm = useCallback(() => setPartForm(INITIAL_PART_FORM), []);

  const startAddPart = useCallback(() => {
    setPartForm(INITIAL_PART_FORM);
    setAddingPart(true);
    setEditingPartId(null);
  }, []);

  const startEditPart = useCallback((part: MaintenancePart) => {
    setPartForm({
      partNumber: part.partNumber,
      nsn: part.nsn || '',
      nomenclature: part.nomenclature,
      quantity: part.quantity,
      unitCost: part.unitCost || 0,
      source: part.source,
      status: part.status,
    });
    setEditingPartId(part.id);
    setAddingPart(false);
  }, []);

  const handleSavePart = useCallback(async () => {
    if (!wo) return;
    setPartSaving(true);
    setError(null);
    try {
      if (addingPart) {
        const newPart = await addPart(wo.id, {
          partNumber: partForm.partNumber,
          nsn: partForm.nsn || undefined,
          nomenclature: partForm.nomenclature,
          quantity: partForm.quantity,
          unitCost: partForm.unitCost || undefined,
          source: partForm.source,
          status: partForm.status,
        });
        setWo({ ...wo, parts: [...wo.parts, newPart] });
        setAddingPart(false);
      } else if (editingPartId) {
        const updated = await updatePart(wo.id, editingPartId, {
          partNumber: partForm.partNumber,
          nsn: partForm.nsn || undefined,
          nomenclature: partForm.nomenclature,
          quantity: partForm.quantity,
          unitCost: partForm.unitCost || undefined,
          source: partForm.source,
          status: partForm.status,
        });
        setWo({ ...wo, parts: wo.parts.map((p) => (p.id === editingPartId ? updated : p)) });
        setEditingPartId(null);
      }
      setPartForm(INITIAL_PART_FORM);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save part.');
    } finally {
      setPartSaving(false);
    }
  }, [wo, addingPart, editingPartId, partForm, onUpdate]);

  const handleDeletePart = useCallback(async (partId: string) => {
    if (!wo) return;
    setError(null);
    try {
      await deletePart(wo.id, partId);
      setWo({ ...wo, parts: wo.parts.filter((p) => p.id !== partId) });
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete part.');
    }
  }, [wo, onUpdate]);

  // ---------- Labor CRUD ----------
  const resetLaborForm = useCallback(() => setLaborForm(INITIAL_LABOR_FORM), []);

  const startAddLabor = useCallback(() => {
    setLaborForm(INITIAL_LABOR_FORM);
    setAddingLabor(true);
    setEditingLaborId(null);
  }, []);

  const startEditLabor = useCallback((labor: MaintenanceLabor) => {
    setLaborForm({
      personnelId: labor.personnelId,
      laborType: labor.laborType,
      hours: labor.hours,
      date: labor.date,
      notes: labor.notes || '',
    });
    setEditingLaborId(labor.id);
    setAddingLabor(false);
  }, []);

  const handleSaveLabor = useCallback(async () => {
    if (!wo) return;
    setLaborSaving(true);
    setError(null);
    try {
      if (addingLabor) {
        const newLabor = await addLabor(wo.id, {
          personnelId: laborForm.personnelId,
          laborType: laborForm.laborType,
          hours: laborForm.hours,
          date: laborForm.date,
          notes: laborForm.notes || undefined,
        });
        setWo({ ...wo, laborEntries: [...wo.laborEntries, newLabor] });
        setAddingLabor(false);
      } else if (editingLaborId) {
        const updated = await updateLabor(wo.id, editingLaborId, {
          personnelId: laborForm.personnelId,
          laborType: laborForm.laborType,
          hours: laborForm.hours,
          date: laborForm.date,
          notes: laborForm.notes || undefined,
        });
        setWo({ ...wo, laborEntries: wo.laborEntries.map((l) => (l.id === editingLaborId ? updated : l)) });
        setEditingLaborId(null);
      }
      setLaborForm(INITIAL_LABOR_FORM);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save labor entry.');
    } finally {
      setLaborSaving(false);
    }
  }, [wo, addingLabor, editingLaborId, laborForm, onUpdate]);

  const handleDeleteLabor = useCallback(async (laborId: string) => {
    if (!wo) return;
    setError(null);
    try {
      await deleteLabor(wo.id, laborId);
      setWo({ ...wo, laborEntries: wo.laborEntries.filter((l) => l.id !== laborId) });
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete labor entry.');
    }
  }, [wo, onUpdate]);

  return {
    wo,
    error,
    setError,

    // Status
    statusLoading,
    transitions: getTransitions(),
    handleStatusChange,

    // Edit
    editMode,
    editSaving,
    editDescription,
    editPriority,
    editAssignedTo,
    editLocation,
    editCategory,
    editEstCompletion,
    setEditDescription,
    setEditPriority,
    setEditAssignedTo,
    setEditLocation,
    setEditCategory,
    setEditEstCompletion,
    startEdit,
    handleSaveEdit,
    cancelEdit: useCallback(() => setEditMode(false), []),

    // Delete
    deleteConfirm,
    setDeleteConfirm,
    isDeleting,
    handleDelete,

    // Parts
    totalPartsCost,
    addingPart,
    editingPartId,
    partForm,
    partSaving,
    setPartForm,
    startAddPart,
    startEditPart,
    handleSavePart,
    cancelAddPart: useCallback(() => { setAddingPart(false); setPartForm(INITIAL_PART_FORM); }, []),
    cancelEditPart: useCallback(() => { setEditingPartId(null); setPartForm(INITIAL_PART_FORM); }, []),
    handleDeletePart,
    resetPartForm,

    // Labor
    totalLaborHours,
    addingLabor,
    editingLaborId,
    laborForm,
    laborSaving,
    setLaborForm,
    startAddLabor,
    startEditLabor,
    handleSaveLabor,
    cancelAddLabor: useCallback(() => { setAddingLabor(false); setLaborForm(INITIAL_LABOR_FORM); }, []),
    cancelEditLabor: useCallback(() => { setEditingLaborId(null); setLaborForm(INITIAL_LABOR_FORM); }, []),
    handleDeleteLabor,
    resetLaborForm,
  };
}
