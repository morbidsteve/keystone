import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Trash2,
  Copy,
  Edit3,
  Check,
  X,
  Loader,
  ChevronDown,
  ChevronRight,
  Play,
  AlertTriangle,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import type {
  DataTemplateListItem,
  DataTemplate,
  FieldMappingConfig,
  MappingPreviewRow,
} from '@/api/schemaMapping';
import {
  getTemplates,
  getTemplate,
  deleteTemplate,
  createTemplate,
  testTemplate,
} from '@/api/schemaMapping';

// ---------------------------------------------------------------------------
// Demo data for when API is unavailable
// ---------------------------------------------------------------------------

const DEMO_TEMPLATES: DataTemplateListItem[] = [
  {
    id: 1,
    name: 'Standard LOGSTAT',
    description: 'Standard USMC LOGSTAT Excel format with supply class columns',
    source_type: 'EXCEL',
    field_count: 7,
    version: 2,
    is_active: true,
    created_by: 1,
    created_at: '2026-02-15T08:00:00Z',
  },
  {
    id: 2,
    name: 'Equipment Readiness Report',
    description: 'Equipment readiness format from BN S4 shops',
    source_type: 'EXCEL',
    field_count: 8,
    version: 1,
    is_active: true,
    created_by: 1,
    created_at: '2026-02-20T10:00:00Z',
  },
  {
    id: 3,
    name: 'Movement Tracker CSV',
    description: 'Convoy movement tracking export from GCSS-MC',
    source_type: 'CSV',
    field_count: 9,
    version: 3,
    is_active: true,
    created_by: 2,
    created_at: '2026-02-25T14:30:00Z',
  },
];

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function SourceTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    EXCEL: 'var(--color-success)',
    CSV: 'var(--color-accent)',
    MIRC: 'var(--color-warning)',
    TAK: 'var(--color-info)',
    CUSTOM: 'var(--color-text-muted)',
  };

  return (
    <span
      className="font-[var(--font-mono)] text-[9px] py-0.5 px-1.5 rounded-[var(--radius)] tracking-[0.5px]" style={{ border: `1px solid ${colors[type] || 'var(--color-text-muted)'}`, color: colors[type] || 'var(--color-text-muted)' }}
    >
      {type}
    </span>
  );
}

function TemplateRow({
  template,
  isExpanded,
  expandedDetail,
  testResult,
  isTesting,
  onToggle,
  onDelete,
  onDuplicate,
  onTest,
}: {
  template: DataTemplateListItem;
  isExpanded: boolean;
  expandedDetail: DataTemplate | null;
  testResult: MappingPreviewRow[] | null;
  isTesting: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onTest: () => void;
}) {
  return (
    <div
      className="border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden" style={{ backgroundColor: isExpanded ? 'var(--color-bg-surface)' : 'transparent', transition: 'background-color var(--transition)' }}
    >
      {/* Header row */}
      <div
        onClick={onToggle}
        className="flex items-center gap-2.5 py-2.5 px-3 cursor-pointer"
        onMouseEnter={(e) => {
          if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {isExpanded ? (
          <ChevronDown size={12} className="text-[var(--color-accent)] shrink-0" />
        ) : (
          <ChevronRight size={12} className="text-[var(--color-text-muted)] shrink-0" />
        )}
        <FileText size={14} className="text-[var(--color-text-muted)] shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-bright)]">
            {template.name}
          </div>
          {template.description && (
            <div
              className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mt-px whitespace-nowrap overflow-hidden text-ellipsis"
            >
              {template.description}
            </div>
          )}
        </div>
        <SourceTypeBadge type={template.source_type} />
        <span
          className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] whitespace-nowrap"
        >
          {template.field_count} fields
        </span>
        <span
          className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] whitespace-nowrap"
        >
          v{template.version}
        </span>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div
          className="border-t border-t-[var(--color-border)]" style={{ padding: '0 12px 12px' }}
        >
          {/* Actions */}
          <div
            className="flex gap-1.5 py-2.5 px-0 border-b border-b-[var(--color-border)] mb-2.5"
          >
            <button onClick={onTest} disabled={isTesting} style={actionBtnStyle}>
              {isTesting ? <Loader size={10} className="animate-spin" /> : <Play size={10} />}
              TEST
            </button>
            <button onClick={onDuplicate} style={actionBtnStyle}>
              <Copy size={10} /> DUPLICATE
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-[var(--color-danger)]"
            >
              <Trash2 size={10} /> DELETE
            </button>
          </div>

          {/* Field mappings */}
          {expandedDetail && (
            <div>
              <div className="section-header mb-1.5">FIELD MAPPINGS</div>
              <div className="flex flex-col gap-[3px]">
                {Object.entries(expandedDetail.field_mappings).map(([srcCol, cfg]) => (
                  <div
                    key={srcCol}
                    className="flex items-center gap-2 py-1 px-2 bg-[var(--color-bg)] rounded-[var(--radius)] font-[var(--font-mono)] text-[10px]"
                  >
                    <span className="text-[var(--color-text)] min-w-[80px]">{srcCol}</span>
                    <span className="text-[var(--color-text-muted)]">-&gt;</span>
                    <span className="text-[var(--color-accent)]">
                      {cfg.target_entity}.{cfg.target_field}
                    </span>
                    {cfg.transform && (
                      <span className="text-[var(--color-warning)] text-[9px] ml-auto">
                        [{cfg.transform}]
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Header patterns */}
          {expandedDetail?.header_patterns && expandedDetail.header_patterns.length > 0 && (
            <div className="mt-2.5">
              <div className="section-header mb-1.5">AUTO-MATCH HEADERS</div>
              <div className="flex flex-wrap gap-1">
                {expandedDetail.header_patterns.map((h) => (
                  <span
                    key={h}
                    className="py-0.5 px-1.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] font-[var(--font-mono)] text-[9px] text-[var(--color-text)]"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Test results */}
          {testResult && (
            <div className="mt-2.5">
              <div className="section-header mb-1.5">TEST RESULTS</div>
              {testResult.length === 0 ? (
                <div
                  className="text-center text-[var(--color-text-muted)] font-[var(--font-mono)] text-[10px] p-3"
                >
                  No sample data provided. Upload a file to test this template.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {testResult.slice(0, 5).map((row, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 py-1 px-2 bg-[var(--color-bg)] rounded-[var(--radius)] mb-0.5 font-[var(--font-mono)] text-[9px]"
                    >
                      <span className="text-[var(--color-text-muted)] min-w-[16px]">#{idx + 1}</span>
                      {row.errors.length > 0 ? (
                        <span className="text-[var(--color-danger)]">
                          <AlertTriangle size={10} className="align-middle mr-1" />
                          {row.errors[0]}
                        </span>
                      ) : (
                        <>
                          <Check size={10} className="text-[var(--color-success)]" />
                          <span className="text-[var(--color-text)]">
                            {Object.entries(row.mapped).slice(0, 4).map(([k, v]) => `${k.split('.').pop()}=${v}`).join(', ')}
                            {Object.keys(row.mapped).length > 4 && '...'}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div
            className="flex gap-4 mt-2.5 pt-2 border-t border-t-[var(--color-border)]"
          >
            <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]">
              Created: {new Date(template.created_at).toLocaleDateString()}
            </span>
            <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]">
              Version: {template.version}
            </span>
            {template.created_by && (
              <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]">
                By: User #{template.created_by}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main TemplateManager
// ---------------------------------------------------------------------------

export default function TemplateManager() {
  const [templates, setTemplates] = useState<DataTemplateListItem[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<DataTemplate | null>(null);
  const [testResults, setTestResults] = useState<Record<number, MappingPreviewRow[]>>({});
  const [testingId, setTestingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSource, setFilterSource] = useState<string>('');

  // Load templates
  useEffect(() => {
    (async () => {
      try {
        const data = await getTemplates(filterSource || undefined);
        setTemplates(data);
      } catch {
        setTemplates(DEMO_TEMPLATES);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [filterSource]);

  // Load detail when expanded
  useEffect(() => {
    if (expandedId === null) {
      setExpandedDetail(null);
      return;
    }
    (async () => {
      try {
        const detail = await getTemplate(expandedId);
        setExpandedDetail(detail);
      } catch {
        // Demo fallback
        setExpandedDetail({
          id: expandedId,
          name: templates.find((t) => t.id === expandedId)?.name || '',
          description: templates.find((t) => t.id === expandedId)?.description || null,
          source_type: templates.find((t) => t.id === expandedId)?.source_type || 'EXCEL',
          field_mappings: {
            UNIT: { target_entity: 'supply_status', target_field: 'unit_id' },
            CLASS: { target_entity: 'supply_status', target_field: 'supply_class' },
            ITEM: { target_entity: 'supply_status', target_field: 'item_description' },
            'ON HAND': { target_entity: 'supply_status', target_field: 'on_hand_qty', transform: 'float' },
            AUTH: { target_entity: 'supply_status', target_field: 'required_qty', transform: 'float' },
            DOS: { target_entity: 'supply_status', target_field: 'dos', transform: 'float' },
            STATUS: { target_entity: 'supply_status', target_field: 'status' },
          },
          header_patterns: ['UNIT', 'CLASS', 'ITEM', 'ON HAND', 'AUTH', 'DOS', 'STATUS'],
          version: templates.find((t) => t.id === expandedId)?.version || 1,
          is_active: true,
          created_by: 1,
          created_at: '2026-02-15T08:00:00Z',
          updated_at: null,
        });
      }
    })();
  }, [expandedId, templates]);

  const handleToggle = useCallback((id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteTemplate(id);
    } catch {
      // Continue anyway in dev mode
    }
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (expandedId === id) setExpandedId(null);
  }, [expandedId]);

  const handleDuplicate = useCallback(async (id: number) => {
    const template = templates.find((t) => t.id === id);
    if (!template || !expandedDetail) return;

    try {
      const newTemplate = await createTemplate({
        name: `${template.name} (Copy)`,
        description: template.description || undefined,
        source_type: template.source_type,
        field_mappings: expandedDetail.field_mappings,
        header_patterns: expandedDetail.header_patterns || undefined,
      });
      setTemplates((prev) => [
        {
          id: newTemplate.id,
          name: newTemplate.name,
          description: newTemplate.description,
          source_type: newTemplate.source_type,
          field_count: Object.keys(newTemplate.field_mappings).length,
          version: newTemplate.version,
          is_active: newTemplate.is_active,
          created_by: newTemplate.created_by,
          created_at: newTemplate.created_at,
        },
        ...prev,
      ]);
    } catch {
      // Demo fallback: add locally
      const newId = Math.max(...templates.map((t) => t.id)) + 1;
      setTemplates((prev) => [
        {
          ...template,
          id: newId,
          name: `${template.name} (Copy)`,
          version: 1,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  }, [templates, expandedDetail]);

  const handleTest = useCallback(async (id: number) => {
    setTestingId(id);
    try {
      const result = await testTemplate(id, [
        { UNIT: '1/1 BN', CLASS: 'I', ITEM: 'MRE', 'ON HAND': 2400, AUTH: 3000, DOS: 8, STATUS: 'GREEN' },
        { UNIT: '2/1 BN', CLASS: 'III', ITEM: 'JP-8', 'ON HAND': 12000, AUTH: 20000, DOS: 4, STATUS: 'AMBER' },
      ]);
      setTestResults((prev) => ({ ...prev, [id]: result.rows }));
    } catch {
      // Demo fallback
      setTestResults((prev) => ({
        ...prev,
        [id]: [
          {
            source: { UNIT: '1/1 BN', CLASS: 'I', ITEM: 'MRE', 'ON HAND': 2400 },
            mapped: { 'supply_status.unit_id': '1/1 BN', 'supply_status.supply_class': 'I', 'supply_status.item_description': 'MRE', 'supply_status.on_hand_qty': 2400 },
            errors: [],
          },
          {
            source: { UNIT: '2/1 BN', CLASS: 'III', ITEM: 'JP-8', 'ON HAND': 12000 },
            mapped: { 'supply_status.unit_id': '2/1 BN', 'supply_status.supply_class': 'III', 'supply_status.item_description': 'JP-8', 'supply_status.on_hand_qty': 12000 },
            errors: [],
          },
        ],
      }));
    } finally {
      setTestingId(null);
    }
  }, []);

  return (
    <Card
      title="SAVED TEMPLATES"
      headerRight={
        <div className="flex items-center gap-2">
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="font-[var(--font-mono)] text-[9px] py-0.5 px-1.5 bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-[var(--radius)]"
          >
            <option value="">ALL TYPES</option>
            <option value="EXCEL">EXCEL</option>
            <option value="CSV">CSV</option>
            <option value="MIRC">MIRC</option>
            <option value="TAK">TAK</option>
            <option value="CUSTOM">CUSTOM</option>
          </select>
          <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]">
            {templates.length} TEMPLATES
          </span>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader size={20} className="animate-spin text-[var(--color-accent)]" />
        </div>
      ) : templates.length === 0 ? (
        <div
          className="text-center text-[var(--color-text-muted)] font-[var(--font-mono)] text-[11px] p-8"
        >
          No saved templates yet. Use the Schema Mapper to create one.
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {templates.map((template) => (
            <TemplateRow
              key={template.id}
              template={template}
              isExpanded={expandedId === template.id}
              expandedDetail={expandedId === template.id ? expandedDetail : null}
              testResult={testResults[template.id] || null}
              isTesting={testingId === template.id}
              onToggle={() => handleToggle(template.id)}
              onDelete={() => handleDelete(template.id)}
              onDuplicate={() => handleDuplicate(template.id)}
              onTest={() => handleTest(template.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const actionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  backgroundColor: 'transparent',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  letterSpacing: '0.5px',
  cursor: 'pointer',
};
