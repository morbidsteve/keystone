// =============================================================================
// CreateRequisitionModal — Modal form to create a new requisition
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import type { SupplyCatalogItem, RequisitionPriority } from '@/lib/types';
import SupplySelector from '@/components/catalog/SupplySelector';
import { createRequisition, submitRequisition } from '@/api/requisitions';
import { useToast } from '@/hooks/useToast';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CreateRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitId: number;
}

// ---------------------------------------------------------------------------
// Priority options
// ---------------------------------------------------------------------------

const PRIORITY_OPTIONS: { value: RequisitionPriority; label: string }[] = [
  { value: '01', label: '01 — ROUTINE' },
  { value: '02', label: '02 — URGENT' },
  { value: '03', label: '03 — EMERGENCY' },
  { value: '04', label: '04' },
  { value: '05', label: '05' },
  { value: '06', label: '06' },
  { value: '07', label: '07' },
  { value: '08', label: '08' },
  { value: '09', label: '09' },
  { value: '10', label: '10' },
  { value: '11', label: '11' },
  { value: '12', label: '12' },
  { value: '13', label: '13' },
  { value: '14', label: '14' },
  { value: '15', label: '15' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CreateRequisitionModal({ isOpen, onClose, unitId }: CreateRequisitionModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedItem, setSelectedItem] = useState<SupplyCatalogItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [priority, setPriority] = useState<RequisitionPriority>('06');
  const [justification, setJustification] = useState('');

  // ESC handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedItem(null);
      setQuantity(1);
      setPriority('06');
      setJustification('');
    }
  }, [isOpen]);

  const createMut = useMutation({
    mutationFn: async (andSubmit: boolean) => {
      const req = await createRequisition(unitId, {
        nomenclature: selectedItem?.nomenclature ?? 'UNKNOWN',
        nsn: selectedItem?.nsn ?? null,
        dodic: selectedItem?.dodic ?? null,
        supply_catalog_item_id: selectedItem?.id ?? null,
        unit_of_issue: selectedItem?.unitOfIssue ?? 'EA',
        quantity_requested: quantity,
        priority,
        justification: justification || null,
      });
      if (andSubmit) {
        return submitRequisition(req.id);
      }
      return req;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      onClose();
      toast.success('Requisition created successfully');
    },
    onError: () => {
      toast.danger('Failed to create requisition');
    },
  });

  if (!isOpen) return null;

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
    marginBottom: 4,
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    outline: 'none',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: 30,
  };

  const btnStyle = (color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color,
    backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
    border: `1px solid ${color}`,
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'all var(--transition)',
  });

  const canCreate = selectedItem != null && quantity > 0;

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center z-[1000]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]" style={{ boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between py-3 px-4 border-b border-b-[var(--color-border)]"
        >
          <span
            className="font-[var(--font-mono)] text-xs font-bold tracking-[2px] text-[var(--color-text-bright)] uppercase"
          >
            NEW REQUISITION
          </span>
          <button
            onClick={onClose}
            className="bg-transparent border-0 text-[var(--color-text-muted)] cursor-pointer p-1 flex items-center"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-3.5">
          {/* Supply item selector */}
          <div>
            <SupplySelector value={selectedItem} onChange={setSelectedItem} />
          </div>

          {/* Quantity */}
          <div>
            <label style={labelStyle}>QUANTITY</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              style={inputStyle}
            />
          </div>

          {/* Priority */}
          <div>
            <label style={labelStyle}>PRIORITY</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as RequisitionPriority)}
              style={selectStyle}
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Justification */}
          <div>
            <label style={labelStyle}>JUSTIFICATION</label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Provide justification for this requisition..."
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-2 py-3 px-4 border-t border-t-[var(--color-border)]"
        >
          <button
            style={btnStyle('var(--color-text-muted)')}
            onClick={onClose}
          >
            CANCEL
          </button>
          <button
            style={{
              ...btnStyle('var(--color-text-bright)'),
              opacity: canCreate ? 1 : 0.4,
            }}
            onClick={() => createMut.mutate(false)}
            disabled={!canCreate || createMut.isPending}
          >
            CREATE DRAFT
          </button>
          <button
            style={{
              ...btnStyle('var(--color-accent)'),
              opacity: canCreate ? 1 : 0.4,
            }}
            onClick={() => createMut.mutate(true)}
            disabled={!canCreate || createMut.isPending}
          >
            CREATE & SUBMIT
          </button>
        </div>
      </div>
    </div>
  );
}
