import apiClient from './client';
import { isDemoMode } from './mockClient';

// --- Types ---

export type DataSourceType = 'mirc_directory' | 'irc_server' | 'excel_directory';
export type DataSourceStatus = 'active' | 'inactive' | 'error' | 'connecting' | 'connected' | 'disconnected';

export interface MIRCDirectoryConfig {
  directory_path: string;
  file_pattern: string;
  poll_interval_seconds: number;
}

export interface IRCServerConfig {
  host: string;
  port: number;
  use_ssl: boolean;
  nick: string;
  channels: string[];
  buffer_seconds: number;
}

export interface ExcelDirectoryConfig {
  directory_path: string;
  file_pattern: string;
  poll_interval_seconds: number;
  template_id: number | null;
}

export type DataSourceConfig = MIRCDirectoryConfig | IRCServerConfig | ExcelDirectoryConfig;

export interface DataSource {
  id: number;
  name: string;
  source_type: DataSourceType;
  is_enabled: boolean;
  config: DataSourceConfig;
  status: DataSourceStatus;
  last_run: string | null;
  last_error: string | null;
  files_processed: number;
  records_ingested: number;
  created_by: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface DataSourceCreate {
  name: string;
  source_type: DataSourceType;
  config: Record<string, unknown>;
  is_enabled?: boolean;
}

export interface DataSourceUpdate {
  name?: string;
  config?: Record<string, unknown>;
  is_enabled?: boolean;
}

export interface ProcessedFile {
  id: number;
  data_source_id: number;
  file_path: string;
  file_hash: string | null;
  records_extracted: number;
  processed_at: string;
}

// --- Demo Data ---

const DEMO_DATA_SOURCES: DataSource[] = [
  {
    id: 1,
    name: 'BN S4 Chat Logs',
    source_type: 'mirc_directory',
    is_enabled: true,
    config: { directory_path: '/data/mirc/bn-s4', file_pattern: '*.log', poll_interval_seconds: 60 },
    status: 'active',
    last_run: new Date(Date.now() - 120000).toISOString(),
    last_error: null,
    files_processed: 47,
    records_ingested: 1283,
    created_by: 1,
    created_at: '2026-02-10T00:00:00Z',
    updated_at: '2026-03-03T08:00:00Z',
  },
  {
    id: 2,
    name: 'RGT LOGNET IRC',
    source_type: 'irc_server',
    is_enabled: true,
    config: { host: 'irc.keystone.usmc.mil', port: 6697, use_ssl: true, nick: 'KEYSTONE-BOT', channels: ['#rgt-log', '#bn-supply', '#maint-ops'], buffer_seconds: 30 },
    status: 'connected',
    last_run: new Date(Date.now() - 30000).toISOString(),
    last_error: null,
    files_processed: 0,
    records_ingested: 856,
    created_by: 1,
    created_at: '2026-02-15T00:00:00Z',
    updated_at: '2026-03-03T09:00:00Z',
  },
  {
    id: 3,
    name: 'GCSS-MC Exports',
    source_type: 'excel_directory',
    is_enabled: true,
    config: { directory_path: '/data/gcss-mc/exports', file_pattern: '*.xlsx', poll_interval_seconds: 120, template_id: 1 },
    status: 'active',
    last_run: new Date(Date.now() - 300000).toISOString(),
    last_error: null,
    files_processed: 23,
    records_ingested: 2150,
    created_by: 3,
    created_at: '2026-02-20T00:00:00Z',
    updated_at: '2026-03-02T14:00:00Z',
  },
  {
    id: 4,
    name: 'Legacy Chat Archive',
    source_type: 'mirc_directory',
    is_enabled: false,
    config: { directory_path: '/data/mirc/archive', file_pattern: '*.log', poll_interval_seconds: 300 },
    status: 'inactive',
    last_run: '2026-02-28T12:00:00Z',
    last_error: null,
    files_processed: 312,
    records_ingested: 8945,
    created_by: 1,
    created_at: '2026-01-20T00:00:00Z',
    updated_at: '2026-02-28T12:00:00Z',
  },
  {
    id: 5,
    name: 'DIV IRC Network',
    source_type: 'irc_server',
    is_enabled: false,
    config: { host: 'irc-div.keystone.usmc.mil', port: 6667, use_ssl: false, nick: 'KEY-DIV', channels: ['#div-ops'], buffer_seconds: 60 },
    status: 'disconnected',
    last_run: null,
    last_error: 'Connection refused: irc-div.keystone.usmc.mil:6667',
    files_processed: 0,
    records_ingested: 0,
    created_by: 1,
    created_at: '2026-02-25T00:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
  },
];

const DEMO_PROCESSED_FILES: ProcessedFile[] = [
  { id: 1, data_source_id: 1, file_path: '/data/mirc/bn-s4/20260303_s4net.log', file_hash: 'a1b2c3d4', records_extracted: 34, processed_at: new Date(Date.now() - 120000).toISOString() },
  { id: 2, data_source_id: 1, file_path: '/data/mirc/bn-s4/20260302_s4net.log', file_hash: 'e5f6a7b8', records_extracted: 28, processed_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, data_source_id: 3, file_path: '/data/gcss-mc/exports/logstat_20260303.xlsx', file_hash: 'c9d0e1f2', records_extracted: 42, processed_at: new Date(Date.now() - 300000).toISOString() },
];

const mockDelay = (ms = 200 + Math.random() * 200): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

// --- API Functions ---

export async function getDataSources(params?: { source_type?: DataSourceType; is_enabled?: boolean }): Promise<DataSource[]> {
  if (isDemoMode) {
    await mockDelay();
    let sources = [...DEMO_DATA_SOURCES];
    if (params?.source_type) sources = sources.filter(s => s.source_type === params.source_type);
    if (params?.is_enabled !== undefined) sources = sources.filter(s => s.is_enabled === params.is_enabled);
    return sources;
  }
  const response = await apiClient.get<DataSource[]>('/data-sources/', { params });
  return response.data;
}

export async function createDataSource(data: DataSourceCreate): Promise<DataSource> {
  if (isDemoMode) {
    await mockDelay();
    return { ...DEMO_DATA_SOURCES[0], ...data, config: data.config as unknown as DataSourceConfig, id: Date.now(), status: 'inactive', files_processed: 0, records_ingested: 0, last_run: null, last_error: null, created_at: new Date().toISOString(), updated_at: null, created_by: 1 };
  }
  const response = await apiClient.post<DataSource>('/data-sources/', data);
  return response.data;
}

export async function updateDataSource(id: number, data: DataSourceUpdate): Promise<DataSource> {
  if (isDemoMode) {
    await mockDelay();
    const existing = DEMO_DATA_SOURCES.find(s => s.id === id) || DEMO_DATA_SOURCES[0];
    return { ...existing, ...data, config: data.config ? data.config as unknown as DataSourceConfig : existing.config };
  }
  const response = await apiClient.put<DataSource>(`/data-sources/${id}`, data);
  return response.data;
}

export async function deleteDataSource(id: number): Promise<void> {
  if (isDemoMode) { await mockDelay(); return; }
  await apiClient.delete(`/data-sources/${id}`);
}

export async function startDataSource(id: number): Promise<{ status: string; message: string }> {
  if (isDemoMode) { await mockDelay(); return { status: 'active', message: 'Source started (demo)' }; }
  const response = await apiClient.post<{ status: string; message: string }>(`/data-sources/${id}/start`);
  return response.data;
}

export async function stopDataSource(id: number): Promise<{ status: string; message: string }> {
  if (isDemoMode) { await mockDelay(); return { status: 'inactive', message: 'Source stopped (demo)' }; }
  const response = await apiClient.post<{ status: string; message: string }>(`/data-sources/${id}/stop`);
  return response.data;
}

export async function testDataSource(id: number): Promise<{ success: boolean; message: string }> {
  if (isDemoMode) { await mockDelay(); return { success: true, message: 'Connection test successful (demo)' }; }
  const response = await apiClient.post<{ success: boolean; message: string }>(`/data-sources/${id}/test`);
  return response.data;
}

export async function getProcessedFiles(sourceId: number): Promise<ProcessedFile[]> {
  if (isDemoMode) { await mockDelay(); return DEMO_PROCESSED_FILES.filter(f => f.data_source_id === sourceId); }
  const response = await apiClient.get<ProcessedFile[]>(`/data-sources/${sourceId}/processed-files`);
  return response.data;
}
