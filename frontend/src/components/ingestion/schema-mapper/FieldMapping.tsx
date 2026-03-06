import { ArrowRight, X, Zap, Eye, Loader } from 'lucide-react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import type {
  CanonicalFieldGroup,
  CanonicalField,
  UploadPreviewResponse,
  AutoDetectResponse,
} from '@/api/schemaMapping';
import type { ColumnMapping } from './types';
import { TRANSFORM_OPTIONS, secondaryBtnStyle } from './types';

// ---------------------------------------------------------------------------
// EntityGroup subcomponent
// ---------------------------------------------------------------------------

function EntityGroup({
  group,
  mappings,
  onSelect,
  expandedEntity,
  onToggle,
}: {
  group: CanonicalFieldGroup;
  mappings: ColumnMapping[];
  onSelect: (field: CanonicalField) => void;
  expandedEntity: string | null;
  onToggle: (entity: string) => void;
}) {
  const isExpanded = expandedEntity === group.entity_name;
  const mappedFields = new Set(
    mappings
      .filter((m) => m.targetEntity === group.entity_name)
      .map((m) => m.targetField),
  );

  return (
    <div
      className="border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden mb-1"
    >
      <button
        onClick={() => onToggle(group.entity_name)}
        className="w-full flex items-center justify-between py-2 px-2.5 bg-[var(--color-bg-surface)] border-0 cursor-pointer text-[var(--color-text)]"
      >
        <div className="flex items-center gap-1.5">
          {isExpanded ? (
            <ChevronDown size={12} className="text-[var(--color-accent)]" />
          ) : (
            <ChevronRight size={12} className="text-[var(--color-text-muted)]" />
          )}
          <span
            className="font-[var(--font-mono)] text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-bright)]"
          >
            {group.entity_group || group.entity_name}
          </span>
        </div>
        <span
          className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
        >
          {mappedFields.size}/{group.fields.length}
        </span>
      </button>
      {isExpanded && (
        <div className="py-1 px-1.5">
          {group.fields.map((field) => {
            const isMapped = mappedFields.has(field.field_name);
            return (
              <button
                key={field.id}
                onClick={() => !isMapped && onSelect(field)}
                disabled={isMapped}
                className="flex items-center justify-between w-full py-1.5 px-2 mb-0.5 rounded-[var(--radius)] text-left text-[var(--color-text)]" style={{ backgroundColor: isMapped ? 'rgba(64, 192, 87, 0.08)' : 'transparent', border: `1px solid ${isMapped ? 'var(--color-success)' : 'transparent'}`, cursor: isMapped ? 'default' : 'pointer', transition: 'background-color var(--transition)' }}
                onMouseEnter={(e) => {
                  if (!isMapped) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isMapped) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div>
                  <div
                    className="font-[var(--font-mono)] text-[11px]" style={{ color: isMapped ? 'var(--color-success)' : 'var(--color-text)' }}
                  >
                    {field.display_name}
                    {field.is_required && (
                      <span className="text-[var(--color-danger)] ml-[3px]">*</span>
                    )}
                  </div>
                  <div
                    className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mt-px"
                  >
                    {field.field_name} ({field.data_type})
                  </div>
                </div>
                {isMapped && <Check size={12} className="text-[var(--color-success)]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldMapping (MapStep)
// ---------------------------------------------------------------------------

interface FieldMappingProps {
  filePreview: UploadPreviewResponse;
  autoDetectResult: AutoDetectResponse | null;
  canonicalGroups: CanonicalFieldGroup[];
  mappings: ColumnMapping[];
  selectedSourceCol: string | null;
  expandedEntity: string | null;
  onSelectSource: (col: string | null) => void;
  onSelectTarget: (field: CanonicalField) => void;
  onRemoveMapping: (col: string) => void;
  onUpdateTransform: (col: string, transform: string) => void;
  onToggleEntity: (entity: string) => void;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
}

export default function FieldMapping({
  filePreview,
  autoDetectResult,
  canonicalGroups,
  mappings,
  selectedSourceCol,
  expandedEntity,
  onSelectSource,
  onSelectTarget,
  onRemoveMapping,
  onUpdateTransform,
  onToggleEntity,
  onBack,
  onNext,
  isLoading,
}: FieldMappingProps) {
  return (
    <div>
      {/* Auto-detect banner */}
      {autoDetectResult && autoDetectResult.matched && (
        <div
          className="flex items-center gap-2 py-2 px-3 mb-4 bg-[rgba(64,192,87,0.1)] border border-[var(--color-success)] rounded-[var(--radius)]"
        >
          <Zap size={14} className="text-[var(--color-success)]" />
          <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-success)]">
            {autoDetectResult.message}
          </span>
        </div>
      )}

      {/* File info */}
      <div
        className="flex items-center gap-3 py-2 px-3 mb-4 bg-[var(--color-bg-surface)] rounded-[var(--radius)] border border-[var(--color-border)]"
      >
        <span className="mono-label text-[var(--color-text-muted)]">FILE</span>
        <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-bright)]">
          {filePreview.file_name}
        </span>
        <span className="mono-label text-[var(--color-text-muted)] ml-auto">
          {filePreview.headers.length} COLUMNS
        </span>
        <span className="mono-label text-[var(--color-text-muted)]">
          {filePreview.row_count} ROWS
        </span>
      </div>

      {/* Two-panel layout */}
      <div className="grid gap-0 mb-4" style={{ gridTemplateColumns: '1fr 40px 1fr' }}>
        {/* Left: Source columns */}
        <div>
          <div className="section-header mb-2">SOURCE COLUMNS</div>
          <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto">
            {filePreview.headers.map((header) => {
              const mapping = mappings.find((m) => m.sourceColumn === header);
              const isSelected = selectedSourceCol === header;
              const sampleValue = filePreview.sample_rows[0]?.[header];

              return (
                <div
                  key={header}
                  onClick={() => onSelectSource(isSelected ? null : header)}
                  className="py-2 px-2.5 rounded-[var(--radius)] cursor-pointer" style={{ backgroundColor: isSelected
                      ? 'rgba(77, 171, 247, 0.12)'
                      : mapping
                        ? 'rgba(64, 192, 87, 0.06)'
                        : 'var(--color-bg-surface)', border: `1px solid ${isSelected ? 'var(--color-accent)' : mapping ? 'var(--color-success)' : 'var(--color-border)'}`, transition: 'all var(--transition)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-bright)]">
                      {header}
                    </span>
                    {mapping && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveMapping(header); }}
                        className="bg-transparent border-0 cursor-pointer text-[var(--color-text-muted)] p-0"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                  {sampleValue !== undefined && sampleValue !== null && (
                    <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mt-0.5">
                      Sample: {String(sampleValue)}
                    </div>
                  )}
                  {mapping && (
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowRight size={10} className="text-[var(--color-success)]" />
                      <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-success)]">
                        {mapping.targetEntity}.{mapping.targetField}
                      </span>
                      <select
                        value={mapping.transform}
                        onChange={(e) => { e.stopPropagation(); onUpdateTransform(header, e.target.value); }}
                        onClick={(e) => e.stopPropagation()}
                        className="font-[var(--font-mono)] text-[9px] py-px px-1 bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-[var(--radius)] ml-auto"
                      >
                        {TRANSFORM_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center arrow */}
        <div className="flex items-center justify-center">
          <ArrowRight
            size={20}
            style={{
              color: selectedSourceCol ? 'var(--color-accent)' : 'var(--color-border-strong)',
              transition: 'color var(--transition)',
            }}
          />
        </div>

        {/* Right: Canonical fields */}
        <div>
          <div className="section-header mb-2">KEYSTONE FIELDS</div>
          {!selectedSourceCol && (
            <div
              className="text-center text-[var(--color-text-muted)] font-[var(--font-mono)] text-[10px] rounded-[var(--radius)] mb-2" style={{ padding: '16px', border: '1px dashed var(--color-border)' }}
            >
              SELECT A SOURCE COLUMN TO MAP
            </div>
          )}
          <div className="max-h-[400px] overflow-y-auto">
            {canonicalGroups.map((group) => (
              <EntityGroup
                key={group.entity_name}
                group={group}
                mappings={mappings}
                onSelect={onSelectTarget}
                expandedEntity={expandedEntity}
                onToggle={onToggleEntity}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mapping summary */}
      <div
        className="flex items-center justify-between py-2.5 px-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius)] mb-4"
      >
        <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]">
          {mappings.length} of {filePreview.headers.length} columns mapped
        </span>
        <div
          className="w-[100px] h-[4px] bg-[var(--color-bg)] rounded-[2px] overflow-hidden"
        >
          <div
            className="h-full" style={{ width: `${(mappings.length / Math.max(filePreview.headers.length, 1)) * 100}%`, backgroundColor: mappings.length > 0 ? 'var(--color-accent)' : 'var(--color-border)', transition: 'width 0.3s ease' }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button onClick={onBack} style={secondaryBtnStyle}>BACK</button>
        <button
          onClick={onNext}
          disabled={mappings.length === 0 || isLoading}
          className="flex items-center gap-1.5 py-2 px-5 border-0 rounded-[var(--radius)] font-[var(--font-mono)] text-[11px] font-semibold tracking-[1.5px]" style={{ backgroundColor: mappings.length > 0 ? 'var(--color-accent)' : 'var(--color-bg-surface)', color: mappings.length > 0 ? 'var(--color-bg)' : 'var(--color-text-muted)', cursor: mappings.length > 0 ? 'pointer' : 'not-allowed', opacity: isLoading ? 0.6 : 1 }}
        >
          {isLoading ? <Loader size={12} className="animate-spin" /> : <Eye size={12} />}
          PREVIEW MAPPING
        </button>
      </div>
    </div>
  );
}
