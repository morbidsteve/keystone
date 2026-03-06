// =============================================================================
// AddEditBilletModal — Add / Edit billet record
// =============================================================================

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { BilletRecord } from '@/lib/types';
import { createBillet, updateBillet } from '@/api/personnel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: BilletRecord | null;
}

const RANKS = [
  'PVT', 'PFC', 'LCpl', 'Cpl', 'Sgt', 'SSgt', 'GySgt', 'MSgt', '1stSgt',
  'MGySgt', 'SgtMaj', 'WO', 'CWO2', 'CWO3', 'CWO4', 'CWO5', '2ndLt',
  '1stLt', 'Capt', 'Maj', 'LtCol', 'Col', 'BGen', 'MajGen', 'LtGen', 'Gen',
];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  width: '100%',
  maxWidth: 460,
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 20px',
  borderBottom: '1px solid var(--color-border)',
};

const bodyStyle: React.CSSProperties = {
  padding: '16px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  padding: '12px 20px',
  borderTop: '1px solid var(--color-border)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '1px',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  marginBottom: 3,
};

const btnBase: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '1px',
  padding: '6px 16px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AddEditBilletModal({ isOpen, onClose, onSaved, initialData }: Props) {
  const isEdit = !!initialData;

  const [unitId, setUnitId] = useState(4);
  const [billetIdCode, setBilletIdCode] = useState('');
  const [billetTitle, setBilletTitle] = useState('');
  const [mosRequired, setMosRequired] = useState('');
  const [rankRequired, setRankRequired] = useState('');
  const [isKeyBillet, setIsKeyBillet] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setUnitId(initialData.unit_id);
        setBilletIdCode(initialData.billet_id_code);
        setBilletTitle(initialData.billet_title);
        setMosRequired(initialData.mos_required ?? '');
        setRankRequired(initialData.rank_required ?? '');
        setIsKeyBillet(initialData.is_key_billet);
      } else {
        setUnitId(4);
        setBilletIdCode('');
        setBilletTitle('');
        setMosRequired('');
        setRankRequired('');
        setIsKeyBillet(false);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Partial<BilletRecord> = {
        unit_id: unitId,
        billet_id_code: billetIdCode,
        billet_title: billetTitle,
        mos_required: mosRequired || null,
        rank_required: rankRequired || null,
        is_key_billet: isKeyBillet,
      };
      if (isEdit && initialData) {
        await updateBillet(initialData.id, payload);
      } else {
        await createBillet(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Save billet failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <span className="font-[var(--font-mono)] text-xs font-bold tracking-[2px] text-[var(--color-text-bright)] uppercase">
            {isEdit ? 'EDIT BILLET' : 'ADD BILLET'}
          </span>
          <button
            onClick={onClose}
            className="bg-transparent border-0 text-[var(--color-text-muted)] cursor-pointer p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          <div className="flex flex-col gap-0.5">
            <label style={labelStyle}>UNIT ID</label>
            <input
              type="number"
              value={unitId}
              onChange={(e) => setUnitId(Number(e.target.value))}
              style={inputStyle}
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label style={labelStyle}>BILLET ID CODE</label>
            <input
              type="text"
              value={billetIdCode}
              onChange={(e) => setBilletIdCode(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label style={labelStyle}>BILLET TITLE</label>
            <input
              type="text"
              value={billetTitle}
              onChange={(e) => setBilletTitle(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label style={labelStyle}>MOS REQUIRED</label>
            <input
              type="text"
              value={mosRequired}
              onChange={(e) => setMosRequired(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label style={labelStyle}>RANK REQUIRED</label>
            <select
              value={rankRequired}
              onChange={(e) => setRankRequired(e.target.value)}
              style={inputStyle}
            >
              <option value="">--</option>
              {RANKS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isKeyBillet}
              onChange={(e) => setIsKeyBillet(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            <label style={{ ...labelStyle, marginBottom: 0 }}>KEY BILLET</label>
          </div>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)]"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-[#000] border border-[var(--color-accent)]" style={{ opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'SAVING...' : 'SAVE'}
          </button>
        </div>
      </div>
    </div>
  );
}
