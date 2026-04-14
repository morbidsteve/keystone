// =============================================================================
// AddEditPersonnelModal — Add / Edit Marine record
// =============================================================================

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import type { PersonnelRecord } from '@/lib/types';
import { createPersonnel, updatePersonnel } from '@/api/personnel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: PersonnelRecord | null;
}

const RANKS = [
  'PVT', 'PFC', 'LCpl', 'Cpl', 'Sgt', 'SSgt', 'GySgt', 'MSgt', '1stSgt',
  'MGySgt', 'SgtMaj', 'WO', 'CWO2', 'CWO3', 'CWO4', 'CWO5', '2ndLt',
  '1stLt', 'Capt', 'Maj', 'LtCol', 'Col', 'BGen', 'MajGen', 'LtGen', 'Gen',
];

const PAY_GRADES = [
  'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9',
  'W1', 'W2', 'W3', 'W4', 'W5',
  'O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7', 'O8', 'O9', 'O10',
];

const RIFLE_QUALS = ['EXPERT', 'SHARPSHOOTER', 'MARKSMAN', 'UNQUAL'];
const SWIM_QUALS = ['CWS1', 'CWS2', 'CWS3', 'CWS4', 'UNQUAL'];
const CLEARANCES = ['NONE', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET', 'TS/SCI'];
const DUTY_STATUSES = ['PRESENT', 'TAD', 'TDY', 'LEAVE', 'LIBERTY', 'LIMDU', 'PTAD', 'UA', 'AWOL', 'DESERTER', 'CONFINEMENT'];
const STATUSES = ['ACTIVE', 'RESERVE', 'MEDICAL', 'ADMIN_SEP', 'TRANSFERRED', 'DEPLOYED'];
const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 3000,
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
  maxWidth: 580,
  maxHeight: '85vh',
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
  overflowY: 'auto',
  flex: 1,
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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
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

const sectionHeaderStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '1.5px',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 0',
  userSelect: 'none',
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

export default function AddEditPersonnelModal({ isOpen, onClose, onSaved, initialData }: Props) {
  const isEdit = !!initialData;

  // Form state
  const [form, setForm] = useState<Record<string, string | number | boolean | null>>({});
  const [saving, setSaving] = useState(false);

  // Collapsible sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    service: false,
    fitness: false,
    additional: false,
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({ ...initialData } as Record<string, string | number | boolean | null>);
      } else {
        setForm({
          edipi: '', firstName: '', lastName: '', rank: '', payGrade: '',
          mos: '', unitId: 4, dateOfRank: '', eaos: '', dutyStatus: 'PRESENT',
          status: 'ACTIVE', securityClearance: 'NONE', clearanceExpiry: '',
          pftScore: '', pftDate: '', cftScore: '', cftDate: '',
          rifleQual: '', rifleQualDate: '', swimQual: '', pmeComplete: false,
          blood_type: '', billet: '', notes: '',
        });
      }
      setOpenSections({ basic: true, service: false, fitness: false, additional: false });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const set = (key: string, value: string | number | boolean | null) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Partial<PersonnelRecord> = {
        edipi: String(form.edipi ?? ''),
        firstName: String(form.firstName ?? ''),
        lastName: String(form.lastName ?? ''),
        rank: form.rank ? String(form.rank) : null,
        unitId: form.unitId ? Number(form.unitId) : null,
        mos: form.mos ? String(form.mos) : null,
        payGrade: form.payGrade ? (String(form.payGrade) as PersonnelRecord['payGrade']) : null,
        billet: form.billet ? String(form.billet) : null,
        dateOfRank: form.dateOfRank ? String(form.dateOfRank) : null,
        eaos: form.eaos ? String(form.eaos) : null,
        dutyStatus: (String(form.dutyStatus ?? 'PRESENT')) as PersonnelRecord['dutyStatus'],
        status: String(form.status ?? 'ACTIVE'),
        securityClearance: form.securityClearance ? (String(form.securityClearance) as PersonnelRecord['securityClearance']) : null,
        clearanceExpiry: form.clearanceExpiry ? String(form.clearanceExpiry) : null,
        pftScore: form.pftScore !== '' && form.pftScore != null ? Number(form.pftScore) : null,
        pftDate: form.pftDate ? String(form.pftDate) : null,
        cftScore: form.cftScore !== '' && form.cftScore != null ? Number(form.cftScore) : null,
        cftDate: form.cftDate ? String(form.cftDate) : null,
        rifleQual: form.rifleQual ? (String(form.rifleQual) as PersonnelRecord['rifleQual']) : null,
        rifleQualDate: form.rifleQualDate ? String(form.rifleQualDate) : null,
        swimQual: form.swimQual ? (String(form.swimQual) as PersonnelRecord['swimQual']) : null,
        pmeComplete: !!form.pmeComplete,
        driversLicenseMilitary: !!form.driversLicenseMilitary,
      };
      if (isEdit && initialData) {
        await updatePersonnel(initialData.id, payload);
      } else {
        await createPersonnel(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const renderField = (label: string, key: string, type: 'text' | 'number' | 'date' | 'select' | 'checkbox' = 'text', options?: string[]) => (
    <div className="flex flex-col gap-0.5">
      <label style={labelStyle}>{label}</label>
      {type === 'select' ? (
        <select
          value={String(form[key] ?? '')}
          onChange={(e) => set(key, e.target.value)}
          style={selectStyle}
        >
          <option value="">--</option>
          {(options ?? []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : type === 'checkbox' ? (
        <div className="flex items-center gap-1.5 py-1 px-0">
          <input
            type="checkbox"
            checked={!!form[key]}
            onChange={(e) => set(key, e.target.checked)}
            className="accent-[var(--color-accent)]"
          />
          <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text)]">
            {form[key] ? 'YES' : 'NO'}
          </span>
        </div>
      ) : (
        <input
          type={type}
          value={form[key] != null ? String(form[key]) : ''}
          onChange={(e) => set(key, type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
          style={inputStyle}
        />
      )}
    </div>
  );

  const renderSection = (key: string, label: string, content: React.ReactNode) => (
    <div className="mb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={sectionHeaderStyle} onClick={() => toggleSection(key)}>
        {openSections[key] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {label}
      </div>
      {openSections[key] && (
        <div className="grid pb-3" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
          {content}
        </div>
      )}
    </div>
  );

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <span className="font-[var(--font-mono)] text-xs font-bold tracking-[2px] text-[var(--color-text-bright)] uppercase">
            {isEdit ? 'EDIT MARINE' : 'ADD MARINE'}
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
          {renderSection('basic', 'BASIC INFO', <>
            {renderField('EDIPI', 'edipi')}
            {renderField('First Name', 'firstName')}
            {renderField('Last Name', 'lastName')}
            {renderField('Rank', 'rank', 'select', RANKS)}
            {renderField('Pay Grade', 'payGrade', 'select', PAY_GRADES)}
            {renderField('MOS', 'mos')}
            {renderField('Unit ID', 'unitId', 'number')}
          </>)}

          {renderSection('service', 'SERVICE', <>
            {renderField('Date of Rank', 'dateOfRank', 'date')}
            {renderField('EAOS', 'eaos', 'date')}
            {renderField('Duty Status', 'dutyStatus', 'select', DUTY_STATUSES)}
            {renderField('Status', 'status', 'select', STATUSES)}
            {renderField('Security Clearance', 'securityClearance', 'select', CLEARANCES)}
            {renderField('Clearance Expiry', 'clearanceExpiry', 'date')}
          </>)}

          {renderSection('fitness', 'FITNESS', <>
            {renderField('PFT Score', 'pftScore', 'number')}
            {renderField('PFT Date', 'pftDate', 'date')}
            {renderField('CFT Score', 'cftScore', 'number')}
            {renderField('CFT Date', 'cftDate', 'date')}
            {renderField('Rifle Qual', 'rifleQual', 'select', RIFLE_QUALS)}
            {renderField('Rifle Qual Date', 'rifleQualDate', 'date')}
            {renderField('Swim Qual', 'swimQual', 'select', SWIM_QUALS)}
            {renderField('PME Complete', 'pmeComplete', 'checkbox')}
          </>)}

          {renderSection('additional', 'ADDITIONAL', <>
            {renderField('Blood Type', 'blood_type', 'select', BLOOD_TYPES)}
            {renderField('Billet', 'billet')}
          </>)}
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
