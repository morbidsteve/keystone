// =============================================================================
// AddToManifestModal — Modal to add an inventory item to the cargo manifest
// =============================================================================

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { LocationInventoryItem, ManifestEntry } from '@/lib/types';

interface AddToManifestModalProps {
  isOpen: boolean;
  item: LocationInventoryItem | null;
  existingEntry?: ManifestEntry | null;
  onClose: () => void;
  onAdd: (entry: ManifestEntry) => void;
}

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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  paddingRight: 28,
};

export default function AddToManifestModal({
  isOpen,
  item,
  existingEntry,
  onClose,
  onAdd,
}: AddToManifestModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<ManifestEntry['priority']>('ROUTINE');
  const [specialHandling, setSpecialHandling] = useState('');

  // Reset / pre-fill when item or existingEntry changes
  useEffect(() => {
    if (existingEntry) {
      setQuantity(existingEntry.quantity);
      setPriority(existingEntry.priority);
      setSpecialHandling(existingEntry.special_handling ?? '');
    } else {
      setQuantity(1);
      setPriority('ROUTINE');
      setSpecialHandling('');
    }
  }, [existingEntry, item]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const maxQty = item.available_qty;

  const handleSubmit = () => {
    const entry: ManifestEntry = {
      item_id: item.item_id,
      nomenclature: item.nomenclature,
      category: item.category,
      quantity,
      priority,
      special_handling: specialHandling.trim() || undefined,
      weight_lbs: item.weight_lbs ? item.weight_lbs * quantity : undefined,
      added_at: existingEntry?.added_at ?? new Date().toISOString(),
    };
    onAdd(entry);
  };

  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    VEHICLES: { bg: 'rgba(96, 165, 250, 0.15)', text: '#60a5fa', border: 'rgba(96, 165, 250, 0.4)' },
    WEAPONS: { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171', border: 'rgba(248, 113, 113, 0.4)' },
    COMMS: { bg: 'rgba(167, 139, 250, 0.15)', text: '#a78bfa', border: 'rgba(167, 139, 250, 0.4)' },
    SUPPLY: { bg: 'rgba(74, 222, 128, 0.15)', text: '#4ade80', border: 'rgba(74, 222, 128, 0.4)' },
    AMMO: { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c', border: 'rgba(251, 146, 60, 0.4)' },
    EQUIPMENT: { bg: 'rgba(250, 204, 21, 0.15)', text: '#facc15', border: 'rgba(250, 204, 21, 0.4)' },
  };

  const catColor = categoryColors[item.category] ?? {
    bg: 'rgba(148, 163, 184, 0.15)',
    text: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.4)',
  };

  return (
    <div
      className="fixed z-[3000] flex items-center justify-center bg-[rgba(0,0,0,0.85)] inset-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-[90%] max-w-[500px] max-h-[80vh] bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-[var(--radius)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div
          className="flex justify-between items-center py-3.5 px-4 border-b border-b-[var(--color-border)]"
        >
          <span
            className="font-[var(--font-mono)] text-xs font-bold tracking-[1.5px] text-[var(--color-text-bright)] uppercase"
          >
            {existingEntry ? 'EDIT MANIFEST ITEM' : 'ADD TO MANIFEST'}
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center bg-transparent border-0 text-[var(--color-text-muted)] cursor-pointer p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div
          className="flex-1 min-h-[0px] overflow-y-auto p-4 flex flex-col gap-3.5"
        >
          {/* Item name (read-only) */}
          <div>
            <label style={labelStyle}>ITEM</label>
            <div
              className="font-[var(--font-mono)] text-xs text-[var(--color-text-bright)] font-semibold"
            >
              {item.nomenclature}
            </div>
          </div>

          {/* Category badge + Available qty */}
          <div className="flex items-center gap-4">
            <div>
              <label style={labelStyle}>CATEGORY</label>
              <span
                className="inline-block py-[3px] px-2.5 rounded-[2px] font-[var(--font-mono)] text-[10px] font-bold tracking-[0.5px]" style={{ color: catColor.text, backgroundColor: catColor.bg, border: `1px solid ${catColor.border}` }}
              >
                {item.category}
              </span>
            </div>
            <div>
              <label style={labelStyle}>AVAILABLE</label>
              <div
                className="font-[var(--font-mono)] text-xs text-[var(--color-text)] font-semibold"
              >
                {item.available_qty}
              </div>
            </div>
            {item.weight_lbs != null && (
              <div>
                <label style={labelStyle}>WT/UNIT (LBS)</label>
                <div
                  className="font-[var(--font-mono)] text-xs text-[var(--color-text)]"
                >
                  {item.weight_lbs.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Quantity selector */}
          <div>
            <label style={labelStyle}>QUANTITY</label>
            <div className="flex items-center gap-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-[36px] h-[36px] flex items-center justify-center bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius) 0 0 var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-base font-bold cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={maxQty}
                value={quantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v)) setQuantity(Math.min(maxQty, Math.max(1, v)));
                }}
                className="text-center rounded-none" style={{ borderLeft: 'none', borderRight: 'none', MozAppearance: 'textfield' }}
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                className="w-[36px] h-[36px] flex items-center justify-center bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[0 var(--radius) var(--radius) 0] text-[var(--color-text)] font-[var(--font-mono)] text-base font-bold cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Priority dropdown */}
          <div>
            <label style={labelStyle}>PRIORITY</label>
            <select
              style={selectStyle}
              value={priority}
              onChange={(e) => setPriority(e.target.value as ManifestEntry['priority'])}
            >
              <option value="ROUTINE">ROUTINE</option>
              <option value="PRIORITY">PRIORITY</option>
              <option value="URGENT">URGENT</option>
              <option value="FLASH">FLASH</option>
            </select>
          </div>

          {/* Special handling textarea */}
          <div>
            <label style={labelStyle}>SPECIAL HANDLING (OPTIONAL)</label>
            <textarea
              className="resize-y"
              rows={3}
              maxLength={500}
              value={specialHandling}
              onChange={(e) => setSpecialHandling(e.target.value)}
              placeholder="e.g., HAZMAT, temperature-controlled, fragile..."
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-2 py-3 px-4 border-t border-t-[var(--color-border)]"
        >
          <button
            type="button"
            onClick={onClose}
            className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] py-2 px-5 border border-[var(--color-border)] rounded-[var(--radius)] bg-transparent text-[var(--color-text-muted)] cursor-pointer uppercase"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] py-2 px-5 border-0 rounded-[var(--radius)] bg-[var(--color-accent)] text-[var(--color-bg)] cursor-pointer uppercase"
          >
            {existingEntry ? 'UPDATE MANIFEST' : 'ADD TO MANIFEST'}
          </button>
        </div>
      </div>
    </div>
  );
}
