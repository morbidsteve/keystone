import apiClient from './client';
import { isDemoMode } from './mockClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CanonicalField {
  id: number;
  entityName: string;
  fieldName: string;
  displayName: string;
  dataType: string;
  isRequired: boolean;
  enumValues: string[] | null;
  description: string | null;
  entityGroup: string | null;
}

export interface CanonicalFieldGroup {
  entityName: string;
  entityGroup: string | null;
  fields: CanonicalField[];
}

export interface FieldMappingConfig {
  targetEntity: string;
  targetField: string;
  transform?: string;
  transformParams?: Record<string, unknown>;
}

export interface DataTemplate {
  id: number;
  name: string;
  description: string | null;
  sourceType: string;
  fieldMappings: Record<string, FieldMappingConfig>;
  headerPatterns: string[] | null;
  version: number;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface DataTemplateListItem {
  id: number;
  name: string;
  description: string | null;
  sourceType: string;
  fieldCount: number;
  version: number;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string;
}

export interface DataTemplateCreate {
  name: string;
  description?: string;
  sourceType: string;
  fieldMappings: Record<string, FieldMappingConfig>;
  headerPatterns?: string[];
}

export interface DataTemplateUpdate {
  name?: string;
  description?: string;
  sourceType?: string;
  fieldMappings?: Record<string, FieldMappingConfig>;
  headerPatterns?: string[];
  isActive?: boolean;
}

export interface MappingPreviewRow {
  source: Record<string, unknown>;
  mapped: Record<string, unknown>;
  errors: string[];
}

export interface MappingPreviewResponse {
  rows: MappingPreviewRow[];
  totalRows: number;
  successfulRows: number;
  errorCount: number;
}

export interface UploadPreviewResponse {
  fileName: string;
  headers: string[];
  sampleRows: Record<string, unknown>[];
  rowCount: number;
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
    entityName: 'supply_record',
    entityGroup: 'Supply',
    fields: [
      { id: 1, entityName: 'supply_record', fieldName: 'itemName', displayName: 'Item Name', dataType: 'string', isRequired: true, enumValues: null, description: 'Name of supply item', entityGroup: 'Supply' },
      { id: 2, entityName: 'supply_record', fieldName: 'supplyClass', displayName: 'Supply Class', dataType: 'enum', isRequired: true, enumValues: ['I','II','III','IIIA','IV','V','VI','VII','VIII','IX','X'], description: 'NATO supply classification', entityGroup: 'Supply' },
      { id: 3, entityName: 'supply_record', fieldName: 'on_hand', displayName: 'On Hand Qty', dataType: 'integer', isRequired: true, enumValues: null, description: 'Current quantity on hand', entityGroup: 'Supply' },
      { id: 4, entityName: 'supply_record', fieldName: 'authorized', displayName: 'Authorized Qty', dataType: 'integer', isRequired: true, enumValues: null, description: 'Authorized quantity', entityGroup: 'Supply' },
    ],
  },
  {
    entityName: 'equipment_record',
    entityGroup: 'Equipment',
    fields: [
      { id: 5, entityName: 'equipment_record', fieldName: 'type', displayName: 'Equipment Type', dataType: 'string', isRequired: true, enumValues: null, description: 'Type/nomenclature of equipment', entityGroup: 'Equipment' },
      { id: 6, entityName: 'equipment_record', fieldName: 'tamcn', displayName: 'TAMCN', dataType: 'string', isRequired: true, enumValues: null, description: 'Table of Authorized Material Control Number', entityGroup: 'Equipment' },
      { id: 7, entityName: 'equipment_record', fieldName: 'authorized', displayName: 'Authorized', dataType: 'integer', isRequired: true, enumValues: null, description: 'Authorized quantity', entityGroup: 'Equipment' },
    ],
  },
];

const DEMO_TEMPLATES: DataTemplateListItem[] = [
  { id: 1, name: 'LOGSTAT Standard', description: 'Standard Marine Corps LOGSTAT format', sourceType: 'Excel', fieldCount: 12, version: 2, isActive: true, createdBy: 1, createdAt: '2026-02-01T00:00:00Z' },
  { id: 2, name: 'Equipment Status Report', description: 'Standard equipment readiness format', sourceType: 'Excel', fieldCount: 8, version: 1, isActive: true, createdBy: 1, createdAt: '2026-02-10T00:00:00Z' },
  { id: 3, name: 'mIRC Logistics Chat', description: 'Parse mIRC chat log for logistics data', sourceType: 'mIRC', fieldCount: 6, version: 3, isActive: true, createdBy: 1, createdAt: '2026-01-20T00:00:00Z' },
];

const DEMO_TEMPLATE_FULL: DataTemplate = {
  id: 1,
  name: 'LOGSTAT Standard',
  description: 'Standard Marine Corps LOGSTAT format',
  sourceType: 'Excel',
  fieldMappings: {
    'Column A': { targetEntity: 'supply_record', targetField: 'itemName' },
    'Column B': { targetEntity: 'supply_record', targetField: 'supplyClass' },
    'Column C': { targetEntity: 'supply_record', targetField: 'on_hand', transform: 'to_integer' },
    'Column D': { targetEntity: 'supply_record', targetField: 'authorized', transform: 'to_integer' },
  },
  headerPatterns: ['ITEM', 'CLASS', 'ON HAND', 'AUTH'],
  version: 2,
  isActive: true,
  createdBy: 1,
  createdAt: '2026-02-01T00:00:00Z',
  updatedAt: '2026-02-15T00:00:00Z',
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
    if (sourceType) templates = templates.filter(t => t.sourceType === sourceType);
    if (activeOnly) templates = templates.filter(t => t.isActive);
    return templates;
  }
  const params: Record<string, string | boolean> = { active_only: activeOnly };
  if (sourceType) params.sourceType = sourceType;
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
  if (isDemoMode) { await mockDelay(); return { ...DEMO_TEMPLATE_FULL, ...data, id: Date.now(), version: 1, isActive: true, createdBy: 1, createdAt: new Date().toISOString(), updatedAt: null, headerPatterns: data.headerPatterns || null }; }
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
  if (isDemoMode) { await mockDelay(); return { ...DEMO_TEMPLATE_FULL, ...data, id, updatedAt: new Date().toISOString() }; }
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
      rows: sampleData.map(row => ({ source: row, mapped: Object.fromEntries(Object.entries(fieldMappings).map(([src, cfg]) => [cfg.targetField, row[src] ?? null])), errors: [] })),
      totalRows: sampleData.length,
      successfulRows: sampleData.length,
      errorCount: 0,
    };
  }
  const response = await apiClient.post<MappingPreviewResponse>(
    '/schema-mapping/preview',
    { fieldMappings: fieldMappings, sample_data: sampleData },
  );
  return response.data;
}

export async function uploadFileForPreview(
  file: File,
): Promise<UploadPreviewResponse> {
  if (isDemoMode) {
    await mockDelay();
    return {
      fileName: file.name,
      headers: ['ITEM', 'CLASS', 'ON HAND', 'AUTH', 'REQUIRED', 'DUE IN'],
      sampleRows: [
        { ITEM: 'MRE Case (12ct)', CLASS: 'I', 'ON HAND': 2400, AUTH: 3000, REQUIRED: 3000, 'DUE IN': 600 },
        { ITEM: 'JP-8 Fuel (gal)', CLASS: 'III', 'ON HAND': 8500, AUTH: 15000, REQUIRED: 15000, 'DUE IN': 4000 },
      ],
      rowCount: 2,
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
    { headers, sampleRows: sampleRows },
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
      totalRows: sampleData.length,
      successfulRows: sampleData.length,
      errorCount: 0,
    };
  }
  const response = await apiClient.post<MappingPreviewResponse>(
    `/schema-mapping/templates/${templateId}/test`,
    sampleData,
  );
  return response.data;
}
