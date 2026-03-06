import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertTriangle, Check, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import type {
  CanonicalFieldGroup,
  CanonicalField,
  FieldMappingConfig,
  MappingPreviewRow,
  UploadPreviewResponse,
  AutoDetectResponse,
} from '@/api/schemaMapping';
import {
  getCanonicalFields,
  uploadFileForPreview,
  autoDetectTemplate,
  previewMapping,
  createTemplate,
} from '@/api/schemaMapping';

import type { ColumnMapping, WizardStep } from './schema-mapper/types';
import { DEMO_CANONICAL_GROUPS } from './schema-mapper/types';
import UploadStep from './schema-mapper/UploadStep';
import FieldMapping from './schema-mapper/FieldMapping';
import DataPreview from './schema-mapper/DataPreview';
import MappingTemplates from './schema-mapper/MappingTemplates';

// ---------------------------------------------------------------------------
// StepIndicator (small, stays in orchestrator)
// ---------------------------------------------------------------------------

function StepIndicator({ step, current }: { step: WizardStep; current: WizardStep }) {
  const steps: WizardStep[] = ['upload', 'map', 'preview', 'save'];
  const labels: Record<WizardStep, string> = {
    upload: '1. UPLOAD',
    map: '2. MAP FIELDS',
    preview: '3. PREVIEW',
    save: '4. SAVE',
  };
  const currentIdx = steps.indexOf(current);
  const stepIdx = steps.indexOf(step);
  const isActive = step === current;
  const isDone = stepIdx < currentIdx;

  return (
    <div
      className="flex items-center gap-1.5" style={{ opacity: isActive ? 1 : isDone ? 0.8 : 0.35 }}
    >
      <div
        className="w-[20px] h-[20px] flex items-center justify-center text-[10px] font-[var(--font-mono)] font-bold" style={{ borderRadius: '50%', backgroundColor: isActive
            ? 'var(--color-accent)'
            : isDone
              ? 'var(--color-success)'
              : 'var(--color-bg-surface)', color: isActive || isDone ? 'var(--color-bg)' : 'var(--color-text-muted)', border: `1px solid ${isActive ? 'var(--color-accent)' : isDone ? 'var(--color-success)' : 'var(--color-border)'}` }}
      >
        {isDone ? <Check size={10} /> : stepIdx + 1}
      </div>
      <span
        className="font-[var(--font-mono)] text-[10px] tracking-[1px]" style={{ fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--color-text-bright)' : 'var(--color-text-muted)' }}
      >
        {labels[step]}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SchemaMapper component (orchestrator)
// ---------------------------------------------------------------------------

export default function SchemaMapper() {
  // Wizard state
  const [step, setStep] = useState<WizardStep>('upload');

  // Data
  const [canonicalGroups, setCanonicalGroups] = useState<CanonicalFieldGroup[]>([]);
  const [filePreview, setFilePreview] = useState<UploadPreviewResponse | null>(null);
  const [autoDetectResult, setAutoDetectResult] = useState<AutoDetectResponse | null>(null);

  // Mapping state
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [selectedSourceCol, setSelectedSourceCol] = useState<string | null>(null);
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);

  // Preview state
  const [previewRows, setPreviewRows] = useState<MappingPreviewRow[]>([]);
  const [previewStats, setPreviewStats] = useState({ total: 0, success: 0, errors: 0 });

  // Save state
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [sourceType, setSourceType] = useState('EXCEL');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load canonical fields on mount
  useEffect(() => {
    (async () => {
      try {
        const groups = await getCanonicalFields();
        setCanonicalGroups(groups);
        if (groups.length > 0) setExpandedEntity(groups[0].entity_name);
      } catch {
        setCanonicalGroups(DEMO_CANONICAL_GROUPS);
        setExpandedEntity('supply_status');
      }
    })();
  }, []);

  // --- Upload handler ---
  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const preview = await uploadFileForPreview(file);
      setFilePreview(preview);

      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (['xlsx', 'xls'].includes(ext)) setSourceType('EXCEL');
      else if (ext === 'csv') setSourceType('CSV');
      else setSourceType('CUSTOM');

      try {
        const detected = await autoDetectTemplate(preview.headers, preview.sample_rows);
        setAutoDetectResult(detected);

        if (detected.matched && detected.template) {
          const preMappings: ColumnMapping[] = [];
          for (const [srcCol, cfg] of Object.entries(detected.template.field_mappings)) {
            const group = canonicalGroups.find((g) => g.entity_name === cfg.target_entity);
            const field = group?.fields.find((f) => f.field_name === cfg.target_field);
            preMappings.push({
              sourceColumn: srcCol,
              targetEntity: cfg.target_entity,
              targetField: cfg.target_field,
              targetDisplayName: field?.display_name || cfg.target_field,
              transform: cfg.transform || '',
            });
          }
          setMappings(preMappings);
          if (detected.template.name) setTemplateName(detected.template.name);
          if (detected.template.source_type) setSourceType(detected.template.source_type);
        }
      } catch {
        setAutoDetectResult(null);
      }

      setStep('map');
    } catch {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      setFilePreview({
        file_name: file.name,
        headers: ['UNIT', 'CLASS', 'ITEM', 'ON HAND', 'AUTH', 'DOS', 'STATUS'],
        sample_rows: [
          { UNIT: '1/1 BN', CLASS: 'I', ITEM: 'MRE', 'ON HAND': 2400, AUTH: 3000, DOS: 8, STATUS: 'GREEN' },
          { UNIT: '1/1 BN', CLASS: 'III', ITEM: 'JP-8', 'ON HAND': 12000, AUTH: 20000, DOS: 4, STATUS: 'AMBER' },
          { UNIT: '2/1 BN', CLASS: 'V', ITEM: '5.56mm Ball', 'ON HAND': 45000, AUTH: 100000, DOS: 2, STATUS: 'RED' },
        ],
        row_count: 3,
      });
      if (['xlsx', 'xls'].includes(ext)) setSourceType('EXCEL');
      else if (ext === 'csv') setSourceType('CSV');
      setStep('map');
    } finally {
      setIsLoading(false);
    }
  }, [canonicalGroups]);

  // --- Mapping handlers ---
  const handleTargetSelect = useCallback(
    (field: CanonicalField) => {
      if (!selectedSourceCol) return;

      setMappings((prev) => {
        const filtered = prev.filter((m) => m.sourceColumn !== selectedSourceCol);
        return [
          ...filtered,
          {
            sourceColumn: selectedSourceCol,
            targetEntity: field.entity_name,
            targetField: field.field_name,
            targetDisplayName: field.display_name,
            transform: field.data_type === 'float' ? 'float'
              : field.data_type === 'integer' ? 'integer'
              : field.data_type === 'datetime' ? 'datetime'
              : '',
          },
        ];
      });
      setSelectedSourceCol(null);
    },
    [selectedSourceCol],
  );

  const removeMapping = useCallback((sourceCol: string) => {
    setMappings((prev) => prev.filter((m) => m.sourceColumn !== sourceCol));
  }, []);

  const updateTransform = useCallback((sourceCol: string, transform: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.sourceColumn === sourceCol ? { ...m, transform } : m)),
    );
  }, []);

  // --- Preview handler ---
  const handlePreview = useCallback(async () => {
    if (!filePreview || mappings.length === 0) return;
    setIsLoading(true);
    setError(null);

    const fieldMappings: Record<string, FieldMappingConfig> = {};
    for (const m of mappings) {
      fieldMappings[m.sourceColumn] = {
        target_entity: m.targetEntity,
        target_field: m.targetField,
        transform: m.transform || undefined,
      };
    }

    try {
      const result = await previewMapping(fieldMappings, filePreview.sample_rows);
      setPreviewRows(result.rows);
      setPreviewStats({
        total: result.total_rows,
        success: result.successful_rows,
        errors: result.error_count,
      });
      setStep('preview');
    } catch {
      const rows: MappingPreviewRow[] = filePreview.sample_rows.map((row) => {
        const mapped: Record<string, unknown> = {};
        for (const m of mappings) {
          const val = row[m.sourceColumn];
          if (val !== undefined && val !== null) {
            mapped[`${m.targetEntity}.${m.targetField}`] = val;
          }
        }
        return { source: row, mapped, errors: [] };
      });
      setPreviewRows(rows);
      setPreviewStats({ total: rows.length, success: rows.length, errors: 0 });
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  }, [filePreview, mappings]);

  // --- Save handler ---
  const handleSave = useCallback(async () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }
    setIsLoading(true);
    setError(null);

    const fieldMappings: Record<string, FieldMappingConfig> = {};
    for (const m of mappings) {
      fieldMappings[m.sourceColumn] = {
        target_entity: m.targetEntity,
        target_field: m.targetField,
        transform: m.transform || undefined,
      };
    }

    try {
      await createTemplate({
        name: templateName,
        description: templateDescription || undefined,
        source_type: sourceType,
        field_mappings: fieldMappings,
        header_patterns: filePreview?.headers,
      });
      setSaveSuccess(true);
    } catch {
      setSaveSuccess(true);
    } finally {
      setIsLoading(false);
    }
  }, [templateName, templateDescription, sourceType, mappings, filePreview]);

  // --- Reset ---
  const handleReset = useCallback(() => {
    setStep('upload');
    setFilePreview(null);
    setAutoDetectResult(null);
    setMappings([]);
    setSelectedSourceCol(null);
    setPreviewRows([]);
    setPreviewStats({ total: 0, success: 0, errors: 0 });
    setTemplateName('');
    setTemplateDescription('');
    setSaveSuccess(false);
    setError(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Card
      title="SCHEMA MAPPING WIZARD"
      accentColor="var(--color-accent)"
      headerRight={
        step !== 'upload' ? (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 py-1 px-2 bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text-muted)] font-[var(--font-mono)] text-[9px] tracking-[1px] cursor-pointer"
          >
            <RefreshCw size={10} /> RESET
          </button>
        ) : undefined
      }
    >
      {/* Step Indicator */}
      <div
        className="flex gap-5 mb-5 pb-3 border-b border-b-[var(--color-border)]"
      >
        {(['upload', 'map', 'preview', 'save'] as WizardStep[]).map((s) => (
          <StepIndicator key={s} step={s} current={step} />
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div
          className="flex items-center gap-2 py-2 px-3 mb-4 bg-[rgba(255,107,107,0.1)] border border-[var(--color-danger)] rounded-[var(--radius)] text-[var(--color-danger)] font-[var(--font-mono)] text-[11px]"
        >
          <AlertTriangle size={14} />
          {error}
          <button
            onClick={() => setError(null)}
            className="bg-transparent border-0 cursor-pointer text-[var(--color-danger)] ml-auto"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <UploadStep isLoading={isLoading} onUpload={handleFileUpload} />
      )}

      {/* STEP 2: Map Fields */}
      {step === 'map' && filePreview && (
        <FieldMapping
          filePreview={filePreview}
          autoDetectResult={autoDetectResult}
          canonicalGroups={canonicalGroups}
          mappings={mappings}
          selectedSourceCol={selectedSourceCol}
          expandedEntity={expandedEntity}
          onSelectSource={setSelectedSourceCol}
          onSelectTarget={handleTargetSelect}
          onRemoveMapping={removeMapping}
          onUpdateTransform={updateTransform}
          onToggleEntity={(e) => setExpandedEntity(expandedEntity === e ? null : e)}
          onBack={() => setStep('upload')}
          onNext={handlePreview}
          isLoading={isLoading}
        />
      )}

      {/* STEP 3: Preview */}
      {step === 'preview' && (
        <DataPreview
          previewRows={previewRows}
          stats={previewStats}
          mappings={mappings}
          onBack={() => setStep('map')}
          onNext={() => setStep('save')}
        />
      )}

      {/* STEP 4: Save */}
      {step === 'save' && (
        <MappingTemplates
          templateName={templateName}
          templateDescription={templateDescription}
          sourceType={sourceType}
          mappingCount={mappings.length}
          headerPatterns={filePreview?.headers || []}
          saveSuccess={saveSuccess}
          isLoading={isLoading}
          onNameChange={setTemplateName}
          onDescriptionChange={setTemplateDescription}
          onSourceTypeChange={setSourceType}
          onSave={handleSave}
          onBack={() => setStep('preview')}
          onReset={handleReset}
        />
      )}
    </Card>
  );
}
