import { useState, useEffect } from 'react';
import { X, Package, Clock, Wrench, User, MapPin, Calendar, Tag, Pencil, Trash2, Plus, Check, AlertTriangle, RotateCcw } from 'lucide-react';
import type { MaintenanceWorkOrder, MaintenancePart, MaintenanceLabor, WorkOrderCategory } from '@/lib/types';
import { WorkOrderStatus, WorkOrderCategory as WOCat, PartSource, PartStatus, LaborType } from '@/lib/types';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { updateWorkOrder, deleteWorkOrder, addPart, updatePart, deletePart, addLabor, updateLabor, deleteLabor } from '@/api/maintenance';

interface WorkOrderDetailModalProps {
  workOrder: MaintenanceWorkOrder | null;
  onClose: () => void;
  onUpdate?: () => void;
}

function getStatusColor(status: WorkOrderStatus): string {
  switch (status) {
    case WorkOrderStatus.OPEN: return 'var(--color-warning)';
    case WorkOrderStatus.IN_PROGRESS: return 'var(--color-accent)';
    case WorkOrderStatus.AWAITING_PARTS: return '#e67e22';
    case WorkOrderStatus.COMPLETE: return 'var(--color-success)';
    default: return 'var(--color-text-muted)';
  }
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

function getPartStatusColor(status: PartStatus): string {
  switch (status) {
    case PartStatus.NEEDED: return 'var(--color-warning)';
    case PartStatus.ON_ORDER: return '#e67e22';
    case PartStatus.RECEIVED: return 'var(--color-accent)';
    case PartStatus.INSTALLED: return 'var(--color-success)';
    default: return 'var(--color-text-muted)';
  }
}

const badgeStyle = (color: string): React.CSSProperties => ({
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.5px',
  padding: '2px 8px',
  borderRadius: 2,
  border: `1px solid ${color}`,
  color,
  backgroundColor: `${color}15`,
  whiteSpace: 'nowrap',
});

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: 4,
};

const valueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--color-text-bright)',
};

const thStyle = (align: 'left' | 'right' = 'left'): React.CSSProperties => ({
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  padding: '6px 10px',
  textAlign: align,
  borderBottom: '1px solid var(--color-border)',
  letterSpacing: '1px',
});

const tdStyle = (mono = false, align: 'left' | 'right' = 'left'): React.CSSProperties => ({
  fontFamily: mono ? 'var(--font-mono)' : 'inherit',
  fontSize: 10,
  padding: '6px 10px',
  color: 'var(--color-text)',
  borderBottom: '1px solid var(--color-border)',
  textAlign: align,
});

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
};

const formLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: 'var(--color-text-muted)',
  marginBottom: 4,
  display: 'block',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  paddingRight: 28,
};

const smallBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: 'none',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  padding: 3,
  borderRadius: 2,
};

const actionBtnStyle = (
  bg: string,
  fg: string,
  disabled?: boolean,
): React.CSSProperties => ({
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '1px',
  padding: '6px 14px',
  border: 'none',
  borderRadius: 'var(--radius)',
  backgroundColor: disabled ? 'var(--color-text-muted)' : bg,
  color: fg,
  cursor: disabled ? 'not-allowed' : 'pointer',
  textTransform: 'uppercase',
  opacity: disabled ? 0.6 : 1,
  whiteSpace: 'nowrap',
});

const inlineTdInput: React.CSSProperties = {
  ...inputStyle,
  padding: '4px 6px',
  fontSize: 10,
};

const inlineTdSelect: React.CSSProperties = {
  ...selectStyle,
  padding: '4px 6px',
  fontSize: 10,
};

export default function WorkOrderDetailModal({ workOrder, onClose, onUpdate }: WorkOrderDetailModalProps) {
  // ----- ESC to close -----
  useEffect(() => {
    if (!workOrder) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [workOrder, onClose]);

  // ----- Local mutable WO state (so we can reflect mutations immediately) -----
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
  const [partForm, setPartForm] = useState({ partNumber: '', nsn: '', nomenclature: '', quantity: 1, unitCost: 0, source: PartSource.ON_HAND as PartSource, status: PartStatus.NEEDED as PartStatus });
  const [partSaving, setPartSaving] = useState(false);

  // Labor inline
  const [addingLabor, setAddingLabor] = useState(false);
  const [editingLaborId, setEditingLaborId] = useState<string | null>(null);
  const [laborForm, setLaborForm] = useState({ personnelId: '', laborType: LaborType.REPAIR as LaborType, hours: 0, date: new Date().toISOString().split('T')[0], notes: '' });
  const [laborSaving, setLaborSaving] = useState(false);

  // Sync workOrder prop → local state
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

  if (!wo) return null;

  const totalLaborHours = wo.laborEntries.reduce((sum, l) => sum + l.hours, 0);
  const totalPartsCost = wo.parts.reduce((sum, p) => sum + (p.unitCost ? p.unitCost * p.quantity : 0), 0);

  // ---------- Status transitions ----------
  const getTransitions = (): { label: string; target: WorkOrderStatus }[] => {
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
  };

  const handleStatusChange = async (target: WorkOrderStatus) => {
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
  };

  // ---------- Edit WO fields ----------
  const startEdit = () => {
    setEditDescription(wo.description || '');
    setEditPriority(wo.priority);
    setEditAssignedTo(wo.assignedTo || '');
    setEditLocation(wo.location || '');
    setEditCategory(wo.category || WOCat.CORRECTIVE);
    setEditEstCompletion(wo.estimatedCompletion ? wo.estimatedCompletion.split('T')[0] : '');
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
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
  };

  // ---------- Delete WO ----------
  const handleDelete = async () => {
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
  };

  // ---------- Parts CRUD ----------
  const resetPartForm = () => {
    setPartForm({ partNumber: '', nsn: '', nomenclature: '', quantity: 1, unitCost: 0, source: PartSource.ON_HAND, status: PartStatus.NEEDED });
  };

  const startAddPart = () => {
    resetPartForm();
    setAddingPart(true);
    setEditingPartId(null);
  };

  const startEditPart = (part: MaintenancePart) => {
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
  };

  const handleSavePart = async () => {
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
      resetPartForm();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save part.');
    } finally {
      setPartSaving(false);
    }
  };

  const handleDeletePart = async (partId: string) => {
    setError(null);
    try {
      await deletePart(wo.id, partId);
      setWo({ ...wo, parts: wo.parts.filter((p) => p.id !== partId) });
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete part.');
    }
  };

  // ---------- Labor CRUD ----------
  const resetLaborForm = () => {
    setLaborForm({ personnelId: '', laborType: LaborType.REPAIR, hours: 0, date: new Date().toISOString().split('T')[0], notes: '' });
  };

  const startAddLabor = () => {
    resetLaborForm();
    setAddingLabor(true);
    setEditingLaborId(null);
  };

  const startEditLabor = (labor: MaintenanceLabor) => {
    setLaborForm({
      personnelId: labor.personnelId,
      laborType: labor.laborType,
      hours: labor.hours,
      date: labor.date,
      notes: labor.notes || '',
    });
    setEditingLaborId(labor.id);
    setAddingLabor(false);
  };

  const handleSaveLabor = async () => {
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
      resetLaborForm();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save labor entry.');
    } finally {
      setLaborSaving(false);
    }
  };

  const handleDeleteLabor = async (laborId: string) => {
    setError(null);
    try {
      await deleteLabor(wo.id, laborId);
      setWo({ ...wo, laborEntries: wo.laborEntries.filter((l) => l.id !== laborId) });
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete labor entry.');
    }
  };

  // ---------- Part form row component ----------
  const renderPartFormRow = (isNew: boolean) => (
    <tr>
      <td style={tdStyle(true)}>
        <input style={inlineTdInput} value={partForm.partNumber} onChange={(e) => setPartForm({ ...partForm, partNumber: e.target.value })} placeholder="Part #" />
      </td>
      <td style={tdStyle(true)}>
        <input style={inlineTdInput} value={partForm.nsn} onChange={(e) => setPartForm({ ...partForm, nsn: e.target.value })} placeholder="NSN" />
      </td>
      <td style={tdStyle()}>
        <input style={inlineTdInput} value={partForm.nomenclature} onChange={(e) => setPartForm({ ...partForm, nomenclature: e.target.value })} placeholder="Name" />
      </td>
      <td style={tdStyle(true, 'right')}>
        <input style={{ ...inlineTdInput, width: 50, textAlign: 'right' }} type="number" min={1} value={partForm.quantity} onChange={(e) => setPartForm({ ...partForm, quantity: Number(e.target.value) })} />
      </td>
      <td style={tdStyle(true)}>
        <select style={inlineTdSelect} value={partForm.source} onChange={(e) => setPartForm({ ...partForm, source: e.target.value as PartSource })}>
          {Object.values(PartSource).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </td>
      <td style={tdStyle(true)}>
        <select style={inlineTdSelect} value={partForm.status} onChange={(e) => setPartForm({ ...partForm, status: e.target.value as PartStatus })}>
          {Object.values(PartStatus).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </td>
      <td style={tdStyle(true, 'right')}>
        <input style={{ ...inlineTdInput, width: 60, textAlign: 'right' }} type="number" min={0} step={0.01} value={partForm.unitCost} onChange={(e) => setPartForm({ ...partForm, unitCost: Number(e.target.value) })} />
      </td>
      <td style={{ ...tdStyle(), whiteSpace: 'nowrap' }}>
        <button style={smallBtnStyle} disabled={partSaving} onClick={handleSavePart} title="Save">
          <Check size={12} style={{ color: 'var(--color-success)' }} />
        </button>
        <button style={smallBtnStyle} onClick={() => { isNew ? setAddingPart(false) : setEditingPartId(null); resetPartForm(); }} title="Cancel">
          <X size={12} style={{ color: 'var(--color-danger)' }} />
        </button>
      </td>
    </tr>
  );

  // ---------- Labor form row component ----------
  const renderLaborFormRow = (isNew: boolean) => (
    <tr>
      <td style={tdStyle(true)}>
        <input style={inlineTdInput} type="date" value={laborForm.date} onChange={(e) => setLaborForm({ ...laborForm, date: e.target.value })} />
      </td>
      <td style={tdStyle(true)}>
        <input style={inlineTdInput} value={laborForm.personnelId} onChange={(e) => setLaborForm({ ...laborForm, personnelId: e.target.value })} placeholder="Personnel ID" />
      </td>
      <td style={tdStyle(true)}>
        <select style={inlineTdSelect} value={laborForm.laborType} onChange={(e) => setLaborForm({ ...laborForm, laborType: e.target.value as LaborType })}>
          {Object.values(LaborType).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </td>
      <td style={tdStyle(true, 'right')}>
        <input style={{ ...inlineTdInput, width: 50, textAlign: 'right' }} type="number" min={0} step={0.5} value={laborForm.hours} onChange={(e) => setLaborForm({ ...laborForm, hours: Number(e.target.value) })} />
      </td>
      <td style={tdStyle()}>
        <input style={inlineTdInput} value={laborForm.notes} onChange={(e) => setLaborForm({ ...laborForm, notes: e.target.value })} placeholder="Notes" />
      </td>
      <td style={{ ...tdStyle(), whiteSpace: 'nowrap' }}>
        <button style={smallBtnStyle} disabled={laborSaving} onClick={handleSaveLabor} title="Save">
          <Check size={12} style={{ color: 'var(--color-success)' }} />
        </button>
        <button style={smallBtnStyle} onClick={() => { isNew ? setAddingLabor(false) : setEditingLaborId(null); resetLaborForm(); }} title="Cancel">
          <X size={12} style={{ color: 'var(--color-danger)' }} />
        </button>
      </td>
    </tr>
  );

  const transitions = getTransitions();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '90%',
          maxWidth: 860,
          maxHeight: '90vh',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 'var(--radius)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '1.5px',
                color: 'var(--color-text-bright)',
              }}
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
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Status transition bar ────────────────────────────────── */}
        {transitions.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '10px 16px',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-elevated)',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--color-text-muted)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginRight: 4,
              }}
            >
              TRANSITION:
            </span>
            {transitions.map((t) => (
              <button
                key={t.target}
                disabled={statusLoading}
                onClick={() => handleStatusChange(t.target)}
                style={actionBtnStyle(
                  t.target === WorkOrderStatus.COMPLETE ? 'var(--color-success)' :
                  t.target === WorkOrderStatus.OPEN ? 'var(--color-warning)' :
                  'var(--color-accent)',
                  'var(--color-bg)',
                  statusLoading,
                )}
              >
                {statusLoading ? 'UPDATING...' : t.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Error bar ───────────────────────────────────────────── */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              backgroundColor: 'var(--color-danger)15',
              borderBottom: '1px solid var(--color-danger)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-danger)',
            }}
          >
            <AlertTriangle size={12} />
            {error}
            <button
              onClick={() => setError(null)}
              style={{ ...smallBtnStyle, marginLeft: 'auto', color: 'var(--color-danger)' }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* ── Scrollable body ────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Edit toggle */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {!editMode ? (
              <button
                onClick={startEdit}
                style={{
                  ...actionBtnStyle('var(--color-bg-hover)', 'var(--color-text-bright)'),
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Pencil size={10} />
                EDIT
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                  style={actionBtnStyle('var(--color-accent)', 'var(--color-bg)', editSaving)}
                >
                  {editSaving ? 'SAVING...' : 'SAVE'}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  disabled={editSaving}
                  style={{
                    ...actionBtnStyle('transparent', 'var(--color-text-muted)'),
                    border: '1px solid var(--color-border)',
                  }}
                >
                  CANCEL
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          {editMode ? (
            <div>
              <label style={formLabelStyle}>DESCRIPTION</label>
              <textarea
                style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
          ) : (
            wo.description && (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--color-text)',
                  lineHeight: 1.5,
                  padding: '10px 12px',
                  backgroundColor: 'var(--color-bg-hover)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                }}
              >
                {wo.description}
              </div>
            )
          )}

          {/* Info Grid */}
          {editMode ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 12,
              }}
            >
              <div>
                <label style={formLabelStyle}>PRIORITY</label>
                <select
                  style={selectStyle}
                  value={editPriority}
                  onChange={(e) => setEditPriority(Number(e.target.value))}
                >
                  <option value={1}>URGENT</option>
                  <option value={2}>PRIORITY</option>
                  <option value={3}>ROUTINE</option>
                </select>
              </div>
              <div>
                <label style={formLabelStyle}>CATEGORY</label>
                <select
                  style={selectStyle}
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as WorkOrderCategory)}
                >
                  <option value={WOCat.CORRECTIVE}>CORRECTIVE</option>
                  <option value={WOCat.PREVENTIVE}>PREVENTIVE</option>
                  <option value={WOCat.MODIFICATION}>MODIFICATION</option>
                  <option value={WOCat.INSPECTION}>INSPECTION</option>
                </select>
              </div>
              <div>
                <label style={formLabelStyle}>ASSIGNED TO</label>
                <input
                  style={inputStyle}
                  value={editAssignedTo}
                  onChange={(e) => setEditAssignedTo(e.target.value)}
                  placeholder="Mechanic name"
                />
              </div>
              <div>
                <label style={formLabelStyle}>LOCATION</label>
                <input
                  style={inputStyle}
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="Bay / Motor Pool"
                />
              </div>
              <div>
                <label style={formLabelStyle}>EST. COMPLETION</label>
                <input
                  style={inputStyle}
                  type="date"
                  value={editEstCompletion}
                  onChange={(e) => setEditEstCompletion(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 16,
              }}
            >
              <div>
                <div style={sectionLabelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Tag size={9} />
                    Equipment ID
                  </span>
                </div>
                <div style={valueStyle}>
                  {wo.individualEquipmentId || wo.equipmentId || '---'}
                </div>
              </div>

              <div>
                <div style={sectionLabelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={9} />
                    Assigned To
                  </span>
                </div>
                <div style={valueStyle}>{wo.assignedTo || '---'}</div>
              </div>

              <div>
                <div style={sectionLabelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={9} />
                    Location
                  </span>
                </div>
                <div style={valueStyle}>{wo.location || '---'}</div>
              </div>

              <div>
                <div style={sectionLabelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={9} />
                    Created
                  </span>
                </div>
                <div style={valueStyle}>{formatDate(wo.createdAt)}</div>
              </div>

              <div>
                <div style={sectionLabelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={9} />
                    Est. Completion
                  </span>
                </div>
                <div style={valueStyle}>
                  {wo.estimatedCompletion ? formatRelativeTime(wo.estimatedCompletion) : '---'}
                </div>
              </div>

              <div>
                <div style={sectionLabelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Wrench size={9} />
                    Actual Hours
                  </span>
                </div>
                <div style={valueStyle}>{wo.actualHours ?? totalLaborHours}h</div>
              </div>

              {wo.completedAt && (
                <div>
                  <div style={sectionLabelStyle}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={9} />
                      Completed
                    </span>
                  </div>
                  <div style={valueStyle}>{formatDate(wo.completedAt)}</div>
                </div>
              )}

              <div>
                <div style={sectionLabelStyle}>Unit</div>
                <div style={valueStyle}>{wo.unitId}</div>
              </div>
            </div>
          )}

          {/* ── Parts Table ──────────────────────────────────────────── */}
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
              <button
                onClick={startAddPart}
                disabled={addingPart}
                style={{
                  ...smallBtnStyle,
                  marginLeft: 8,
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  padding: '2px 8px',
                  gap: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: 'var(--color-accent)',
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  cursor: addingPart ? 'not-allowed' : 'pointer',
                }}
              >
                <Plus size={9} />
                ADD PART
              </button>
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
                    <th style={thStyle()}>PART #</th>
                    <th style={thStyle()}>NSN</th>
                    <th style={thStyle()}>NOMENCLATURE</th>
                    <th style={thStyle('right')}>QTY</th>
                    <th style={thStyle()}>SOURCE</th>
                    <th style={thStyle()}>STATUS</th>
                    <th style={thStyle('right')}>COST</th>
                    <th style={thStyle()}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {wo.parts.map((part) =>
                    editingPartId === part.id ? (
                      renderPartFormRow(false)
                    ) : (
                      <tr key={part.id}>
                        <td style={{ ...tdStyle(true), color: 'var(--color-text-bright)' }}>
                          {part.partNumber}
                        </td>
                        <td style={{ ...tdStyle(true), color: 'var(--color-text-muted)', fontSize: 9 }}>
                          {part.nsn || '---'}
                        </td>
                        <td style={tdStyle()}>
                          {part.nomenclature}
                        </td>
                        <td style={tdStyle(true, 'right')}>
                          {part.quantity}
                        </td>
                        <td style={{ ...tdStyle(true), fontSize: 9, color: 'var(--color-text-muted)' }}>
                          {part.source.replace(/_/g, ' ')}
                        </td>
                        <td style={{ ...tdStyle(true), fontSize: 9, color: getPartStatusColor(part.status) }}>
                          {part.status.replace(/_/g, ' ')}
                        </td>
                        <td style={{ ...tdStyle(true, 'right'), color: 'var(--color-text)' }}>
                          {part.unitCost ? `$${(part.unitCost * part.quantity).toLocaleString()}` : '---'}
                        </td>
                        <td style={{ ...tdStyle(), whiteSpace: 'nowrap' }}>
                          <button style={smallBtnStyle} onClick={() => startEditPart(part)} title="Edit Part">
                            <Pencil size={11} style={{ color: 'var(--color-accent)' }} />
                          </button>
                          <button style={smallBtnStyle} onClick={() => handleDeletePart(part.id)} title="Delete Part">
                            <Trash2 size={11} style={{ color: 'var(--color-danger)' }} />
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                  {addingPart && renderPartFormRow(true)}
                  {wo.parts.length === 0 && !addingPart && (
                    <tr>
                      <td colSpan={8} style={{ ...tdStyle(), textAlign: 'center', color: 'var(--color-text-muted)', padding: '12px 10px' }}>
                        No parts recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
                {wo.parts.length > 0 && (
                  <tfoot>
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          fontWeight: 600,
                          padding: '8px 10px',
                          textAlign: 'right',
                          color: 'var(--color-text-muted)',
                          letterSpacing: '1px',
                        }}
                      >
                        TOTAL
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '8px 10px',
                          textAlign: 'right',
                          color: 'var(--color-text-bright)',
                        }}
                      >
                        ${totalPartsCost.toLocaleString()}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* ── Labor Table ──────────────────────────────────────────── */}
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
              LABOR ({wo.laborEntries.length} entries, {totalLaborHours}h total)
              <button
                onClick={startAddLabor}
                disabled={addingLabor}
                style={{
                  ...smallBtnStyle,
                  marginLeft: 8,
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  padding: '2px 8px',
                  gap: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: 'var(--color-accent)',
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  cursor: addingLabor ? 'not-allowed' : 'pointer',
                }}
              >
                <Plus size={9} />
                ADD LABOR
              </button>
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
                    <th style={thStyle()}>DATE</th>
                    <th style={thStyle()}>PERSONNEL</th>
                    <th style={thStyle()}>TYPE</th>
                    <th style={thStyle('right')}>HOURS</th>
                    <th style={thStyle()}>NOTES</th>
                    <th style={thStyle()}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {wo.laborEntries.map((labor) =>
                    editingLaborId === labor.id ? (
                      renderLaborFormRow(false)
                    ) : (
                      <tr key={labor.id}>
                        <td style={{ ...tdStyle(true), whiteSpace: 'nowrap' }}>
                          {labor.date}
                        </td>
                        <td style={{ ...tdStyle(true), color: 'var(--color-text-muted)', fontSize: 9 }}>
                          {labor.personnelId}
                        </td>
                        <td style={{ ...tdStyle(true), fontSize: 9, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                          {labor.laborType}
                        </td>
                        <td style={{ ...tdStyle(true, 'right'), color: 'var(--color-text-bright)', fontWeight: 600 }}>
                          {labor.hours}h
                        </td>
                        <td style={tdStyle()}>
                          {labor.notes || '---'}
                        </td>
                        <td style={{ ...tdStyle(), whiteSpace: 'nowrap' }}>
                          <button style={smallBtnStyle} onClick={() => startEditLabor(labor)} title="Edit Labor">
                            <Pencil size={11} style={{ color: 'var(--color-accent)' }} />
                          </button>
                          <button style={smallBtnStyle} onClick={() => handleDeleteLabor(labor.id)} title="Delete Labor">
                            <Trash2 size={11} style={{ color: 'var(--color-danger)' }} />
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                  {addingLabor && renderLaborFormRow(true)}
                  {wo.laborEntries.length === 0 && !addingLabor && (
                    <tr>
                      <td colSpan={6} style={{ ...tdStyle(), textAlign: 'center', color: 'var(--color-text-muted)', padding: '12px 10px' }}>
                        No labor entries recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
                {wo.laborEntries.length > 0 && (
                  <tfoot>
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          fontWeight: 600,
                          padding: '8px 10px',
                          textAlign: 'right',
                          color: 'var(--color-text-muted)',
                          letterSpacing: '1px',
                        }}
                      >
                        TOTAL
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '8px 10px',
                          textAlign: 'right',
                          color: 'var(--color-text-bright)',
                        }}
                      >
                        {totalLaborHours}h
                      </td>
                      <td colSpan={2} style={{ borderBottom: 'none' }} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* ── Delete Work Order ──────────────────────────────────── */}
          <div
            style={{
              marginTop: 12,
              padding: '12px 16px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-bg-elevated)',
            }}
          >
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                style={{
                  ...actionBtnStyle('transparent', 'var(--color-danger)'),
                  border: '1px solid var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Trash2 size={10} />
                DELETE WORK ORDER
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-danger)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <AlertTriangle size={12} />
                  PERMANENTLY DELETE {wo.workOrderNumber}?
                </span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={actionBtnStyle('var(--color-danger)', '#fff', isDeleting)}
                >
                  {isDeleting ? 'DELETING...' : 'CONFIRM DELETE'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  disabled={isDeleting}
                  style={{
                    ...actionBtnStyle('transparent', 'var(--color-text-muted)'),
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <RotateCcw size={10} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '12px 16px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '1px',
              padding: '8px 24px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-bg-hover)',
              color: 'var(--color-text-bright)',
              cursor: 'pointer',
              transition: 'background-color var(--transition)',
            }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
