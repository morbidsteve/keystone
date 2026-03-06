import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { MaintenanceWorkOrder, WorkOrderCategory, EquipmentCatalogItem } from '@/lib/types';
import { WorkOrderPriority, WorkOrderCategory as WOCat } from '@/lib/types';
import { createWorkOrder } from '@/api/maintenance';
import EquipmentSelector from '@/components/catalog/EquipmentSelector';

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (wo: MaintenanceWorkOrder) => void;
  defaultEquipmentId?: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
};

const labelStyle: React.CSSProperties = {
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

function generateWONumber(): string {
  const yr = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `WO-${yr}-${seq}`;
}

export default function CreateWorkOrderModal({
  isOpen,
  onClose,
  onCreate,
  defaultEquipmentId,
}: CreateWorkOrderModalProps) {
  const [woNumber, setWoNumber] = useState(generateWONumber());
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<number>(WorkOrderPriority.ROUTINE);
  const [category, setCategory] = useState<WorkOrderCategory>(WOCat.CORRECTIVE);
  const [equipmentId, setEquipmentId] = useState(defaultEquipmentId || '');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentCatalogItem | null>(null);
  const [unitId, setUnitId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [location, setLocation] = useState('');
  const [estimatedCompletion, setEstimatedCompletion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createWorkOrder({
        workOrderNumber: woNumber,
        description: description.trim(),
        priority,
        category,
        individualEquipmentId: equipmentId || undefined,
        unitId: unitId || undefined,
        assignedTo: assignedTo || undefined,
        location: location || undefined,
        estimatedCompletion: estimatedCompletion || undefined,
      });
      onCreate(result);
      // Reset form
      setWoNumber(generateWONumber());
      setDescription('');
      setPriority(WorkOrderPriority.ROUTINE);
      setCategory(WOCat.CORRECTIVE);
      setEquipmentId(defaultEquipmentId || '');
      setSelectedEquipment(null);
      setUnitId('');
      setAssignedTo('');
      setLocation('');
      setEstimatedCompletion('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create work order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed z-[3000] flex items-center justify-center bg-[rgba(0,0,0,0.85)] inset-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-[90%] max-w-[600px] max-h-[90vh] bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-[var(--radius)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div
          className="flex justify-between items-center py-3.5 px-4 border-b border-b-[var(--color-border)]"
        >
          <span
            className="font-[var(--font-mono)] text-xs font-bold tracking-[1.5px] text-[var(--color-text-bright)] uppercase"
          >
            CREATE WORK ORDER
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center bg-transparent border-0 text-[var(--color-text-muted)] cursor-pointer p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 min-h-[0px] overflow-y-auto p-4 flex flex-col gap-3"
        >
          {error && (
            <div
              className="flex items-center gap-2 py-2 px-3 bg-[var(--color-danger)15] border border-[var(--color-danger)] rounded-[var(--radius)] font-[var(--font-mono)] text-[11px] text-[var(--color-danger)]"
            >
              <AlertTriangle size={12} />
              {error}
            </div>
          )}

          <div
            className="grid gap-3 grid-cols-2"
          >
            {/* WO Number */}
            <div>
              <label style={labelStyle}>WORK ORDER #</label>
              <input
                style={inputStyle}
                value={woNumber}
                onChange={(e) => setWoNumber(e.target.value)}
              />
            </div>

            {/* Priority */}
            <div>
              <label style={labelStyle}>PRIORITY</label>
              <select
                style={selectStyle}
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              >
                <option value={1}>URGENT</option>
                <option value={2}>PRIORITY</option>
                <option value={3}>ROUTINE</option>
              </select>
            </div>

            {/* Description */}
            <div className="col-span-full">
              <label style={labelStyle}>DESCRIPTION *</label>
              <textarea
                className="resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the maintenance requirement..."
                required
              />
            </div>

            {/* Category */}
            <div>
              <label style={labelStyle}>CATEGORY</label>
              <select
                style={selectStyle}
                value={category}
                onChange={(e) => setCategory(e.target.value as WorkOrderCategory)}
              >
                <option value={WOCat.CORRECTIVE}>CORRECTIVE</option>
                <option value={WOCat.PREVENTIVE}>PREVENTIVE</option>
                <option value={WOCat.MODIFICATION}>MODIFICATION</option>
                <option value={WOCat.INSPECTION}>INSPECTION</option>
              </select>
            </div>

            {/* Equipment Catalog Selector */}
            <div className="col-span-full">
              <EquipmentSelector
                value={selectedEquipment}
                onChange={(item) => {
                  setSelectedEquipment(item);
                  if (item) {
                    setEquipmentId(item.tamcn || `CAT-${item.id}`);
                  } else {
                    setEquipmentId(defaultEquipmentId || '');
                  }
                }}
                placeholder="Search by TAMCN, nomenclature, name..."
              />
            </div>

            {/* Equipment ID (auto-filled or manual) */}
            <div>
              <label style={labelStyle}>EQUIPMENT ID</label>
              <input
                style={inputStyle}
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
                placeholder="e.g., HQ-001"
              />
            </div>

            {/* Unit ID */}
            <div>
              <label style={labelStyle}>UNIT ID</label>
              <input
                style={inputStyle}
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                placeholder="e.g., 1/2 MAR"
              />
            </div>

            {/* Assigned To */}
            <div>
              <label style={labelStyle}>ASSIGNED TO</label>
              <input
                style={inputStyle}
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Mechanic name"
              />
            </div>

            {/* Location */}
            <div>
              <label style={labelStyle}>LOCATION</label>
              <input
                style={inputStyle}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Bay 3, Motor Pool"
              />
            </div>

            {/* Est. Completion */}
            <div>
              <label style={labelStyle}>EST. COMPLETION</label>
              <input
                style={inputStyle}
                type="date"
                value={estimatedCompletion}
                onChange={(e) => setEstimatedCompletion(e.target.value)}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div
          className="flex justify-end gap-2 py-3 px-4 border-t border-t-[var(--color-border)]"
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] py-2 px-5 border border-[var(--color-border)] rounded-[var(--radius)] bg-transparent text-[var(--color-text-muted)] uppercase" style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] py-2 px-5 border-0 rounded-[var(--radius)] text-[var(--color-bg)] uppercase" style={{ backgroundColor: isSubmitting ? 'var(--color-text-muted)' : 'var(--color-accent)', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'CREATING...' : 'CREATE WORK ORDER'}
          </button>
        </div>
      </div>
    </div>
  );
}
