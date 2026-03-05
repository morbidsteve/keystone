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
          maxWidth: 500,
          maxHeight: '80vh',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 'var(--radius)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '1.5px',
              color: 'var(--color-text-bright)',
              textTransform: 'uppercase',
            }}
          >
            {existingEntry ? 'EDIT MANIFEST ITEM' : 'ADD TO MANIFEST'}
          </span>
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

        {/* Body */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Item name (read-only) */}
          <div>
            <label style={labelStyle}>ITEM</label>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--color-text-bright)',
                fontWeight: 600,
              }}
            >
              {item.nomenclature}
            </div>
          </div>

          {/* Category badge + Available qty */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <label style={labelStyle}>CATEGORY</label>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: 2,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: catColor.text,
                  backgroundColor: catColor.bg,
                  border: `1px solid ${catColor.border}`,
                }}
              >
                {item.category}
              </span>
            </div>
            <div>
              <label style={labelStyle}>AVAILABLE</label>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--color-text)',
                  fontWeight: 600,
                }}
              >
                {item.available_qty}
              </div>
            </div>
            {item.weight_lbs != null && (
              <div>
                <label style={labelStyle}>WT/UNIT (LBS)</label>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--color-text)',
                  }}
                >
                  {item.weight_lbs.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Quantity selector */}
          <div>
            <label style={labelStyle}>QUANTITY</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius) 0 0 var(--radius)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
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
                style={{
                  ...inputStyle,
                  width: 70,
                  textAlign: 'center',
                  borderRadius: 0,
                  borderLeft: 'none',
                  borderRight: 'none',
                  MozAppearance: 'textfield',
                }}
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                style={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0 var(--radius) var(--radius) 0',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
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
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
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
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '12px 16px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '1px',
              padding: '8px 20px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '1px',
              padding: '8px 20px',
              border: 'none',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-bg)',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {existingEntry ? 'UPDATE MANIFEST' : 'ADD TO MANIFEST'}
          </button>
        </div>
      </div>
    </div>
  );
}
