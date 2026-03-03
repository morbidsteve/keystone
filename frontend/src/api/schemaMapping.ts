import apiClient from './client';

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
// API Functions
// ---------------------------------------------------------------------------

export async function getCanonicalFields(): Promise<CanonicalFieldGroup[]> {
  const response = await apiClient.get<CanonicalFieldGroup[]>(
    '/schema-mapping/canonical-fields',
  );
  return response.data;
}

export async function getTemplates(
  sourceType?: string,
  activeOnly = true,
): Promise<DataTemplateListItem[]> {
  const params: Record<string, string | boolean> = { active_only: activeOnly };
  if (sourceType) params.source_type = sourceType;
  const response = await apiClient.get<DataTemplateListItem[]>(
    '/schema-mapping/templates',
    { params },
  );
  return response.data;
}

export async function getTemplate(id: number): Promise<DataTemplate> {
  const response = await apiClient.get<DataTemplate>(
    `/schema-mapping/templates/${id}`,
  );
  return response.data;
}

export async function createTemplate(
  data: DataTemplateCreate,
): Promise<DataTemplate> {
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
  const response = await apiClient.put<DataTemplate>(
    `/schema-mapping/templates/${id}`,
    data,
  );
  return response.data;
}

export async function deleteTemplate(id: number): Promise<void> {
  await apiClient.delete(`/schema-mapping/templates/${id}`);
}

export async function previewMapping(
  fieldMappings: Record<string, FieldMappingConfig>,
  sampleData: Record<string, unknown>[],
): Promise<MappingPreviewResponse> {
  const response = await apiClient.post<MappingPreviewResponse>(
    '/schema-mapping/preview',
    { field_mappings: fieldMappings, sample_data: sampleData },
  );
  return response.data;
}

export async function uploadFileForPreview(
  file: File,
): Promise<UploadPreviewResponse> {
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
  const response = await apiClient.post<MappingPreviewResponse>(
    `/schema-mapping/templates/${templateId}/test`,
    sampleData,
  );
  return response.data;
}
