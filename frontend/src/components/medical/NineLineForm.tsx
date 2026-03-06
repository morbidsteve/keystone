// =============================================================================
// NineLineForm — 9-Line CASEVAC request form
// =============================================================================

import { useState, useCallback } from 'react';
import { AlertTriangle, Send } from 'lucide-react';
import { CASEVACPrecedence, TriageCategory } from '@/lib/types';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const PRECEDENCE_OPTIONS = [
  { value: CASEVACPrecedence.URGENT_SURGICAL, label: 'URGENT SURGICAL' },
  { value: CASEVACPrecedence.URGENT, label: 'URGENT' },
  { value: CASEVACPrecedence.PRIORITY, label: 'PRIORITY' },
  { value: CASEVACPrecedence.ROUTINE, label: 'ROUTINE' },
  { value: CASEVACPrecedence.CONVENIENCE, label: 'CONVENIENCE' },
];

const SPECIAL_EQUIPMENT_OPTIONS = [
  'NONE', 'HOIST', 'EXTRACTION_EQUIPMENT', 'VENTILATOR',
];

const SECURITY_OPTIONS = [
  'NO_ENEMY', 'POSSIBLE_ENEMY', 'ENEMY_IN_AREA', 'ENEMY_CONTACT',
];

const PATIENT_TYPE_OPTIONS = [
  'US_MILITARY', 'US_CIVILIAN', 'NON_US_MILITARY', 'NON_US_CIVILIAN', 'EPW',
];

const MARKING_OPTIONS = [
  'PANELS', 'PYROTECHNIC_SIGNAL', 'SMOKE_SIGNAL', 'VS_17_PANEL', 'NONE', 'OTHER',
];

const NATIONALITY_OPTIONS = [
  'US', 'COALITION', 'HOST_NATION', 'OTHER',
];

const TRIAGE_OPTIONS = [
  { value: TriageCategory.IMMEDIATE, label: 'IMMEDIATE (T1)' },
  { value: TriageCategory.DELAYED, label: 'DELAYED (T2)' },
  { value: TriageCategory.MINIMAL, label: 'MINIMAL (T3)' },
  { value: TriageCategory.EXPECTANT, label: 'EXPECTANT (T4)' },
];

const TCCC_INTERVENTIONS = [
  'tourniquet', 'chest_seal', 'npa', 'iv_access', 'txa', 'cricothyrotomy', 'hypothermia_prevention', 'splint',
];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  marginBottom: 4,
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  color: 'var(--color-text-bright)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: 30,
};

const sectionStyle: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  marginBottom: 12,
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: 'var(--color-danger)',
  marginBottom: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  marginBottom: 12,
};

// ---------------------------------------------------------------------------
// Form State
// ---------------------------------------------------------------------------

interface FormData {
  precedence: CASEVACPrecedence;
  numberOfPatients: number;
  specialEquipment: string;
  securityAtPickup: string;
  patientType: string;
  markingMethod: string;
  nationalityStatus: string;
  nbcContamination: boolean;
  mechanismOfInjury: string;
  injuriesDescription: string;
  triageCategory: TriageCategory | '';
  tcccInterventions: string[];
  remarks: string;
  locationLat: string;
  locationLon: string;
  locationMgrs: string;
  locationDescription: string;
}

const initialFormData: FormData = {
  precedence: CASEVACPrecedence.URGENT,
  numberOfPatients: 1,
  specialEquipment: 'NONE',
  securityAtPickup: 'NO_ENEMY',
  patientType: 'US_MILITARY',
  markingMethod: 'VS_17_PANEL',
  nationalityStatus: 'US',
  nbcContamination: false,
  mechanismOfInjury: '',
  injuriesDescription: '',
  triageCategory: '',
  tcccInterventions: [],
  remarks: '',
  locationLat: '',
  locationLon: '',
  locationMgrs: '',
  locationDescription: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NineLineForm() {
  const [form, setForm] = useState<FormData>(initialFormData);
  const [submitted, setSubmitted] = useState(false);

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleIntervention = useCallback((intervention: string) => {
    setForm((prev) => ({
      ...prev,
      tcccInterventions: prev.tcccInterventions.includes(intervention)
        ? prev.tcccInterventions.filter((i) => i !== intervention)
        : [...prev.tcccInterventions, intervention],
    }));
  }, []);

  const handleSubmit = () => {
    // In a real implementation, this would POST to the API
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm(initialFormData);
    }, 3000);
  };

  if (submitted) {
    return (
      <div
        className="p-10 text-center font-[var(--font-mono)]"
      >
        <div
          className="text-sm font-bold text-[var(--color-danger)] mb-2 tracking-[2px]"
        >
          9-LINE SUBMITTED
        </div>
        <div className="text-[11px] text-[var(--color-text-muted)]">
          Casualty report has been transmitted. Awaiting acknowledgement...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[720px]">
      {/* Line 1 — Precedence */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <AlertTriangle size={12} />
          LINE 1 — PRECEDENCE
        </div>
        <div className="mb-0">
          <label style={labelStyle}>CASEVAC PRECEDENCE</label>
          <select
            style={selectStyle}
            value={form.precedence}
            onChange={(e) => update('precedence', e.target.value as CASEVACPrecedence)}
          >
            {PRECEDENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Line 2 — Number of Patients */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <AlertTriangle size={12} />
          LINE 2 — NUMBER OF PATIENTS
        </div>
        <div>
          <label style={labelStyle}>PATIENT COUNT</label>
          <input
            type="number"
            min={1}
            max={100}
            style={{ ...inputStyle, width: 120 }}
            value={form.numberOfPatients}
            onChange={(e) => update('numberOfPatients', parseInt(e.target.value) || 1)}
          />
        </div>
      </div>

      {/* Line 3 — Special Equipment */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <AlertTriangle size={12} />
          LINE 3 — SPECIAL EQUIPMENT
        </div>
        <div>
          <label style={labelStyle}>EQUIPMENT REQUIRED</label>
          <select
            style={selectStyle}
            value={form.specialEquipment}
            onChange={(e) => update('specialEquipment', e.target.value)}
          >
            {SPECIAL_EQUIPMENT_OPTIONS.map((o) => (
              <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Line 4 — Security at Pickup Site */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <AlertTriangle size={12} />
          LINE 4 — SECURITY AT PICKUP
        </div>
        <div>
          <label style={labelStyle}>SECURITY STATUS</label>
          <select
            style={selectStyle}
            value={form.securityAtPickup}
            onChange={(e) => update('securityAtPickup', e.target.value)}
          >
            {SECURITY_OPTIONS.map((o) => (
              <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Line 5 — Patient Type + Marking Method */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <AlertTriangle size={12} />
          LINE 5 — PATIENT TYPE &amp; MARKING
        </div>
        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>PATIENT TYPE</label>
            <select
              style={selectStyle}
              value={form.patientType}
              onChange={(e) => update('patientType', e.target.value)}
            >
              {PATIENT_TYPE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>MARKING METHOD</label>
            <select
              style={selectStyle}
              value={form.markingMethod}
              onChange={(e) => update('markingMethod', e.target.value)}
            >
              {MARKING_OPTIONS.map((o) => (
                <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Line 6 — Nationality + NBC */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <AlertTriangle size={12} />
          LINE 6 — NATIONALITY &amp; NBC
        </div>
        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>NATIONALITY</label>
            <select
              style={selectStyle}
              value={form.nationalityStatus}
              onChange={(e) => update('nationalityStatus', e.target.value)}
            >
              {NATIONALITY_OPTIONS.map((o) => (
                <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>NBC CONTAMINATION</label>
            <div
              className="flex items-center gap-2 py-2 px-0"
            >
              <input
                type="checkbox"
                checked={form.nbcContamination}
                onChange={(e) => update('nbcContamination', e.target.checked)}
                style={{ accentColor: 'var(--color-danger)' }}
              />
              <span
                className="font-[var(--font-mono)] text-[11px]" style={{ color: form.nbcContamination ? 'var(--color-danger)' : 'var(--color-text-muted)', fontWeight: form.nbcContamination ? 700 : 400 }}
              >
                {form.nbcContamination ? 'CONTAMINATED' : 'NO CONTAMINATION'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Line 7 — Mechanism of Injury + Description */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <AlertTriangle size={12} />
          LINE 7 — MECHANISM OF INJURY
        </div>
        <div className="mb-3">
          <label style={labelStyle}>MECHANISM</label>
          <input
            type="text"
            style={inputStyle}
            placeholder="e.g., IED blast, GSW, fall from height..."
            value={form.mechanismOfInjury}
            onChange={(e) => update('mechanismOfInjury', e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>INJURIES DESCRIPTION</label>
          <textarea
            className="resize-y"
            placeholder="Describe injuries, interventions performed, vital signs..."
            value={form.injuriesDescription}
            onChange={(e) => update('injuriesDescription', e.target.value)}
          />
        </div>
      </div>

      {/* Line 8 — Triage + TCCC Interventions */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <AlertTriangle size={12} />
          LINE 8 — TRIAGE &amp; TCCC
        </div>
        <div className="mb-3">
          <label style={labelStyle}>TRIAGE CATEGORY</label>
          <select
            style={selectStyle}
            value={form.triageCategory}
            onChange={(e) => update('triageCategory', e.target.value as TriageCategory | '')}
          >
            <option value="">-- SELECT --</option>
            {TRIAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>TCCC INTERVENTIONS APPLIED</label>
          <div
            className="flex flex-wrap gap-2 mt-1"
          >
            {TCCC_INTERVENTIONS.map((intervention) => {
              const active = form.tcccInterventions.includes(intervention);
              return (
                <button
                  key={intervention}
                  type="button"
                  onClick={() => toggleIntervention(intervention)}
                  className="py-1 px-2.5 font-[var(--font-mono)] text-[9px] tracking-[0.5px] uppercase rounded-[var(--radius)] cursor-pointer" style={{ fontWeight: active ? 700 : 400, border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`, backgroundColor: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent', color: active ? 'var(--color-accent)' : 'var(--color-text-muted)', transition: 'all var(--transition)' }}
                >
                  {intervention.replace(/_/g, ' ')}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Line 9 — Remarks */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <AlertTriangle size={12} />
          LINE 9 — REMARKS
        </div>
        <div>
          <label style={labelStyle}>ADDITIONAL REMARKS</label>
          <textarea
            className="resize-y"
            placeholder="Terrain info, weather, LZ conditions, additional context..."
            value={form.remarks}
            onChange={(e) => update('remarks', e.target.value)}
          />
        </div>
      </div>

      {/* Location */}
      <div style={sectionStyle}>
        <div style={{ ...sectionTitleStyle, color: 'var(--color-accent)' }}>
          PICKUP LOCATION
        </div>
        <div style={{ ...rowStyle, gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div>
            <label style={labelStyle}>LATITUDE</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="33.3528"
              value={form.locationLat}
              onChange={(e) => update('locationLat', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>LONGITUDE</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="44.3661"
              value={form.locationLon}
              onChange={(e) => update('locationLon', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>MGRS</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="38SMB4512067890"
              value={form.locationMgrs}
              onChange={(e) => update('locationMgrs', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>LOCATION DESCRIPTION</label>
          <input
            type="text"
            style={inputStyle}
            placeholder="e.g., MSR TAMPA, 2km S of CP ALPHA"
            value={form.locationDescription}
            onChange={(e) => update('locationDescription', e.target.value)}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        className="w-full py-3 px-0 font-[var(--font-mono)] text-xs font-bold tracking-[2px] uppercase text-[#fff] bg-[var(--color-danger)] border-0 rounded-[var(--radius)] cursor-pointer flex items-center justify-center gap-2 transition-opacity duration-[var(--transition)]"
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
      >
        <Send size={14} />
        TRANSMIT 9-LINE CASEVAC
      </button>
    </div>
  );
}
