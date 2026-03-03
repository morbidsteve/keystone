import apiClient from './client';
import { isDemoMode } from './mockClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CanonicalField {
  id: number;
  entity_name: string;
  field_name: string;
  display_name: string;
  data_type: string;
  is_required: boolean;
  enum_values: string[] | null;
  description: string | null;
  entity_group: string | null;
}

export interface CanonicalFieldGroup {
  entity_name: string;
  entity_group: string | null;
  fields: CanonicalField[];
}

export interface FieldMappingConfig {
  target_entity: string;
  target_field: string;
  transform?: string;
  transform_params?: Record<string, unknown>;
}

export interface DataTemplate {
  id: number;
  name: string;
  description: string | null;
  source_type: string;
  field_mappings: Record<string, FieldMappingConfig>;
  header_patterns: string[] | null;
  version: number;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface DataTemplateListItem {
  id: number;
  name: string;
  description: string | null;
  source_type: string;
  field_count: number;
  version: number;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
}

export interface DataTemplateCreate {
  name: string;
  description?: string;
  source_type: string;
  field_mappings: Record<string, FieldMappingConfig>;
  header_patterns?: string[];
}

export interface DataTemplateUpdate {
  name?: string;
  description?: string;
  source_type?: string;
  field_mappings?: Record<string, FieldMappingConfig>;
  header_patterns?: string[];
  is_active?: boolean;
}

export interface MappingPreviewRow {
  source: Record<string, unknown>;
  mapped: Record<string, unknown>;
  errors: string[];
}

export interface MappingPreviewResponse {
  rows: MappingPreviewRow[];
  total_rows: number;
  successful_rows: number;
  error_count: number;
}

export interface UploadPreviewResponse {
  file_name: string;
  headers: string[];
  sample_rows: Record<string, unknown>[];
  row_count: number;
}

export interface AutoDetectResponse {
  matched: boolean;
  template: DataTemplate | null;
  confidence: number;
  message: string;
}

// ---------------------------------------------------------------------------
// Demo mock data for schema mapping
// ---------------------------------------------------------------------------

const mockDelay = (ms = 200 + Math.random() * 200): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

const DEMO_CANONICAL_FIELDS: CanonicalFieldGroup[] = [
  {
    entity_name: 'supply_record',
    entity_group: 'Supply',
    fields: [
      { id: 1, entity_name: 'supply_record', field_name: 'item_name', display_name: 'Item Name', data_type: 'string', is_required: true, enum_values: null, description: 'Name of supply item', entity_group: 'Supply' },
      { id: 2, entity_name: 'supply_record', field_name: 'supply_class', display_name: 'Supply Class', data_type: 'enum', is_required: true, enum_values: ['I','II','III','IIIA','IV','V','VI','VII','VIII','IX','X'], description: 'NATO supply classification', entity_group: 'Supply' },
      { id: 3, entity_name: 'supply_record', field_name: 'on_hand', display_name: 'On Hand Qty', data_type: 'integer', is_required: true, enum_values: null, description: 'Current quantity on hand', entity_group: 'Supply' },
      { id: 4, entity_name: 'supply_record', field_name: 'authorized', display_name: 'Authorized Qty', data_type: 'integer', is_required: true, enum_values: null, description: 'Authorized quantity', entity_group: 'Supply' },
    ],
  },
  {
    entity_name: 'equipment_record',
    entity_group: 'Equipment',
    fields: [
      { id: 5, entity_name: 'equipment_record', field_name: 'type', display_name: 'Equipment Type', data_type: 'string', is_required: true, enum_values: null, description: 'Type/nomenclature of equipment', entity_group: 'Equipment' },
      { id: 6, entity_name: 'equipment_record', field_name: 'tamcn', display_name: 'TAMCN', data_type: 'string', is_required: true, enum_values: null, description: 'Table of Authorized Material Control Number', entity_group: 'Equipment' },
      { id: 7, entity_name: 'equipment_record', field_name: 'authorized', display_name: 'Authorized', data_type: 'integer', is_required: true, enum_values: null, description: 'Authorized quantity', entity_group: 'Equipment' },
    ],
  },
];

const DEMO_TEMPLATES: DataTemplateListItem[] = [
  { id: 1, name: 'LOGSTAT Standard', description: 'Standard Marine Corps LOGSTAT format', source_type: 'Excel', field_count: 12, version: 2, is_active: true, created_by: 1, created_at: '2026-02-01T00:00:00Z' },
  { id: 2, name: 'Equipment Status Report', description: 'Standard equipment readiness format', source_type: 'Excel', field_count: 8, version: 1, is_active: true, created_by: 1, created_at: '2026-02-10T00:00:00Z' },
  { id: 3, name: 'mIRC Logistics Chat', description: 'Parse mIRC chat log for logistics data', source_type: 'mIRC', field_count: 6, version: 3, is_active: true, created_by: 1, created_at: '2026-01-20T00:00:00Z' },
];

const DEMO_TEMPLATE_FULL: DataTemplate = {
  id: 1,
  name: 'LOGSTAT Standard',
  description: 'Standard Marine Corps LOGSTAT format',
  source_type: 'Excel',
  field_mappings: {
    'Column A': { target_entity: 'supply_record', target_field: 'item_name' },
    'Column B': { target_entity: 'supply_record', target_field: 'supply_class' },
    'Column C': { target_entity: 'supply_record', target_field: 'on_hand', transform: 'to_integer' },
    'Column D': { target_entity: 'supply_record', target_field: 'authorized', transform: 'to_integer' },
  },
  header_patterns: ['ITEM', 'CLASS', 'ON HAND', 'AUTH'],
  version: 2,
  is_active: true,
  created_by: 1,
  created_at: '2026-02-01T00:00:00Z',
  updated_at: '2026-02-15T00:00:00Z',
};

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function getCanonicalFields(): Promise<CanonicalFieldGroup[]> {
  if (isDemoMode) { await mockDelay(); return DEMO_CANONICAL_FIELDS; }
  const response = await apiClient.get<CanonicalFieldGroup[]>(
    '/schema-mapping/canonical-fields',
  );
  return response.data;
}

export async function getTemplates(
  sourceType?: string,
  activeOnly = true,
): Promise<DataTemplateListItem[]> {
  if (isDemoMode) {
    await mockDelay();
    let templates = [...DEMO_TEMPLATES];
    if (sourceType) templates = templates.filter(t => t.source_type === sourceType);
    if (activeOnly) templates = templates.filter(t => t.is_active);
    return templates;
  }
  const params: Record<string, string | boolean> = { active_only: activeOnly };
  if (sourceType) params.source_type = sourceType;
  const response = await apiClient.get<DataTemplateListItem[]>(
    '/schema-mapping/templates',
    { params },
  );
  return response.data;
}

export async function getTemplate(id: number): Promise<DataTemplate> {
  if (isDemoMode) { await mockDelay(); return { ...DEMO_TEMPLATE_FULL, id }; }
  const response = await apiClient.get<DataTemplate>(
    `/schema-mapping/templates/${id}`,
  );
  return response.data;
}

export async function createTemplate(
  data: DataTemplateCreate,
): Promise<DataTemplate> {
  if (isDemoMode) { await mockDelay(); return { ...DEMO_TEMPLATE_FULL, ...data, id: Date.now(), version: 1, is_active: true, created_by: 1, created_at: new Date().toISOString(), updated_at: null, header_patterns: data.header_patterns || null }; }
  const response = await apiClient.post<DataTemplate>(
    '/schema-mapping/templates',
    data,
  );
  return response.data;
}

export async function updateTemplate(
  id: number,
  data: DataTemplateUpdate,
): Promise<DataTemplate> {
  if (isDemoMode) { await mockDelay(); return { ...DEMO_TEMPLATE_FULL, ...data, id, updated_at: new Date().toISOString() }; }
  const response = await apiClient.put<DataTemplate>(
    `/schema-mapping/templates/${id}`,
    data,
  );
  return response.data;
}

export async function deleteTemplate(id: number): Promise<void> {
  if (isDemoMode) { await mockDelay(); void id; return; }
  await apiClient.delete(`/schema-mapping/templates/${id}`);
}

export async function previewMapping(
  fieldMappings: Record<string, FieldMappingConfig>,
  sampleData: Record<string, unknown>[],
): Promise<MappingPreviewResponse> {
  if (isDemoMode) {
    await mockDelay();
    return {
      rows: sampleData.map(row => ({ source: row, mapped: Object.fromEntries(Object.entries(fieldMappings).map(([src, cfg]) => [cfg.target_field, row[src] ?? null])), errors: [] })),
      total_rows: sampleData.length,
      successful_rows: sampleData.length,
      error_count: 0,
    };
  }
  const response = await apiClient.post<MappingPreviewResponse>(
    '/schema-mapping/preview',
    { field_mappings: fieldMappings, sample_data: sampleData },
  );
  return response.data;
}

export async function uploadFileForPreview(
  file: File,
): Promise<UploadPreviewResponse> {
  if (isDemoMode) {
    await mockDelay();
    return {
      file_name: file.name,
      headers: ['ITEM', 'CLASS', 'ON HAND', 'AUTH', 'REQUIRED', 'DUE IN'],
      sample_rows: [
        { ITEM: 'MRE Case (12ct)', CLASS: 'I', 'ON HAND': 2400, AUTH: 3000, REQUIRED: 3000, 'DUE IN': 600 },
        { ITEM: 'JP-8 Fuel (gal)', CLASS: 'III', 'ON HAND': 8500, AUTH: 15000, REQUIRED: 15000, 'DUE IN': 4000 },
      ],
      row_count: 2,
    };
  }
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<UploadPreviewResponse>(
    '/schema-mapping/upload-preview',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return response.data;
}

export async function autoDetectTemplate(
  headers: string[],
  sampleRows?: Record<string, unknown>[],
): Promise<AutoDetectResponse> {
  if (isDemoMode) {
    await mockDelay();
    void sampleRows;
    const hasLogstat = headers.some(h => h.toUpperCase().includes('CLASS') || h.toUpperCase().includes('ON HAND'));
    return hasLogstat
      ? { matched: true, template: DEMO_TEMPLATE_FULL, confidence: 0.92, message: 'Matched LOGSTAT Standard template' }
      : { matched: false, template: null, confidence: 0.0, message: 'No matching template found' };
  }
  const response = await apiClient.post<AutoDetectResponse>(
    '/schema-mapping/auto-detect',
    { headers, sample_rows: sampleRows },
  );
  return response.data;
}

export async function testTemplate(
  templateId: number,
  sampleData: Record<string, unknown>[],
): Promise<MappingPreviewResponse> {
  if (isDemoMode) {
    await mockDelay();
    void templateId;
    return {
      rows: sampleData.map(row => ({ source: row, mapped: row, errors: [] })),
      total_rows: sampleData.length,
      successful_rows: sampleData.length,
      error_count: 0,
    };
  }
  const response = await apiClient.post<MappingPreviewResponse>(
    `/schema-mapping/templates/${templateId}/test`,
    sampleData,
  );
  return response.data;
}
