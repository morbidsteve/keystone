import { Save, Loader, Check, RefreshCw } from 'lucide-react';
import { inputStyle, primaryBtnStyle, secondaryBtnStyle, SOURCE_TYPE_OPTIONS } from './types';

interface MappingTemplatesProps {
  templateName: string;
  templateDescription: string;
  sourceType: string;
  mappingCount: number;
  headerPatterns: string[];
  saveSuccess: boolean;
  isLoading: boolean;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onSourceTypeChange: (v: string) => void;
  onSave: () => void;
  onBack: () => void;
  onReset: () => void;
}

export default function MappingTemplates({
  templateName,
  templateDescription,
  sourceType,
  mappingCount,
  headerPatterns,
  saveSuccess,
  isLoading,
  onNameChange,
  onDescriptionChange,
  onSourceTypeChange,
  onSave,
  onBack,
  onReset,
}: MappingTemplatesProps) {
  if (saveSuccess) {
    return (
      <div className="text-center p-8">
        <div
          className="w-[48px] h-[48px] bg-[rgba(64,192,87,0.15)] flex items-center justify-center" style={{ borderRadius: '50%', border: '2px solid var(--color-success)', margin: '0 auto 16px' }}
        >
          <Check size={24} className="text-[var(--color-success)]" />
        </div>
        <div className="font-[var(--font-mono)] text-sm font-bold text-[var(--color-success)] mb-2">
          TEMPLATE SAVED
        </div>
        <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] mb-6">
          &quot;{templateName}&quot; has been saved and will be used for future auto-matching.
        </div>
        <button onClick={onReset} style={primaryBtnStyle}>
          <RefreshCw size={12} /> MAP ANOTHER FILE
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Form */}
      <div className="flex flex-col gap-4 mb-5">
        <div>
          <label className="mono-label block text-[var(--color-text-muted)] mb-1.5" >
            TEMPLATE NAME *
          </label>
          <input
            value={templateName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. 1st MLG LOGSTAT Format"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="mono-label block text-[var(--color-text-muted)] mb-1.5" >
            DESCRIPTION
          </label>
          <textarea
            value={templateDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Brief description of this template format..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mono-label block text-[var(--color-text-muted)] mb-1.5" >
              SOURCE TYPE
            </label>
            <select
              value={sourceType}
              onChange={(e) => onSourceTypeChange(e.target.value)}
              style={inputStyle}
            >
              {SOURCE_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mono-label block text-[var(--color-text-muted)] mb-1.5" >
              FIELD MAPPINGS
            </label>
            <div className="font-[var(--font-mono)] text-xl font-bold text-[var(--color-accent)] py-1 px-0">
              {mappingCount}
            </div>
          </div>
        </div>
      </div>

      {/* Header patterns preview */}
      <div
        className="py-2.5 px-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius)] mb-4"
      >
        <div className="section-header mb-1.5">
          AUTO-MATCH HEADERS ({headerPatterns.length})
        </div>
        <div className="flex flex-wrap gap-1">
          {headerPatterns.map((h) => (
            <span
              key={h}
              className="py-0.5 px-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] font-[var(--font-mono)] text-[9px] text-[var(--color-text)]"
            >
              {h}
            </span>
          ))}
        </div>
        <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mt-1.5">
          Future files with these column headers will auto-match this template.
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button onClick={onBack} style={secondaryBtnStyle}>BACK</button>
        <button
          onClick={onSave}
          disabled={!templateName.trim() || isLoading}
          style={{
            ...primaryBtnStyle,
            opacity: !templateName.trim() || isLoading ? 0.5 : 1,
            cursor: !templateName.trim() || isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? <Loader size={12} className="animate-spin" /> : <Save size={12} />}
          SAVE TEMPLATE
        </button>
      </div>
    </div>
  );
}
