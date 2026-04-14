import apiClient from './client';
import { isDemoMode } from './mockClient';

// --- Types ---

export type DataSourceType = 'mirc_directory' | 'irc_server' | 'excel_directory';
export type DataSourceStatus = 'active' | 'inactive' | 'error' | 'connecting' | 'connected' | 'disconnected';

export interface MIRCDirectoryConfig {
  directoryPath: string;
  filePattern: string;
  pollIntervalSeconds: number;
}

export interface IRCServerConfig {
  host: string;
  port: number;
  useSsl: boolean;
  nick: string;
  channels: string[];
  bufferSeconds: number;
}

export interface ExcelDirectoryConfig {
  directoryPath: string;
  filePattern: string;
  pollIntervalSeconds: number;
  templateId: number | null;
}

export type DataSourceConfig = MIRCDirectoryConfig | IRCServerConfig | ExcelDirectoryConfig;

export interface DataSource {
  id: number;
  name: string;
  sourceType: DataSourceType;
  isEnabled: boolean;
  config: DataSourceConfig;
  status: DataSourceStatus;
  lastRun: string | null;
  lastError: string | null;
  filesProcessed: number;
  recordsIngested: number;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface DataSourceCreate {
  name: string;
  sourceType: DataSourceType;
  config: Record<string, unknown>;
  isEnabled?: boolean;
}

export interface DataSourceUpdate {
  name?: string;
  config?: Record<string, unknown>;
  isEnabled?: boolean;
}

export interface ProcessedFile {
  id: number;
  dataSourceId: number;
  filePath: string;
  fileHash: string | null;
  recordsExtracted: number;
  processedAt: string;
}

// --- Demo Data ---

const DEMO_DATA_SOURCES: DataSource[] = [
  {
    id: 1,
    name: 'BN S4 Chat Logs',
    sourceType: 'mirc_directory',
    isEnabled: true,
    config: { directoryPath: '/data/mirc/bn-s4', filePattern: '*.log', pollIntervalSeconds: 60 },
    status: 'active',
    lastRun: new Date(Date.now() - 120000).toISOString(),
    lastError: null,
    filesProcessed: 47,
    recordsIngested: 1283,
    createdBy: 1,
    createdAt: '2026-02-10T00:00:00Z',
    updatedAt: '2026-03-03T08:00:00Z',
  },
  {
    id: 2,
    name: 'RGT LOGNET IRC',
    sourceType: 'irc_server',
    isEnabled: true,
    config: { host: 'irc.keystone.usmc.mil', port: 6697, useSsl: true, nick: 'KEYSTONE-BOT', channels: ['#rgt-log', '#bn-supply', '#maint-ops'], bufferSeconds: 30 },
    status: 'connected',
    lastRun: new Date(Date.now() - 30000).toISOString(),
    lastError: null,
    filesProcessed: 0,
    recordsIngested: 856,
    createdBy: 1,
    createdAt: '2026-02-15T00:00:00Z',
    updatedAt: '2026-03-03T09:00:00Z',
  },
  {
    id: 3,
    name: 'GCSS-MC Exports',
    sourceType: 'excel_directory',
    isEnabled: true,
    config: { directoryPath: '/data/gcss-mc/exports', filePattern: '*.xlsx', pollIntervalSeconds: 120, templateId: 1 },
    status: 'active',
    lastRun: new Date(Date.now() - 300000).toISOString(),
    lastError: null,
    filesProcessed: 23,
    recordsIngested: 2150,
    createdBy: 3,
    createdAt: '2026-02-20T00:00:00Z',
    updatedAt: '2026-03-02T14:00:00Z',
  },
  {
    id: 4,
    name: 'Legacy Chat Archive',
    sourceType: 'mirc_directory',
    isEnabled: false,
    config: { directoryPath: '/data/mirc/archive', filePattern: '*.log', pollIntervalSeconds: 300 },
    status: 'inactive',
    lastRun: '2026-02-28T12:00:00Z',
    lastError: null,
    filesProcessed: 312,
    recordsIngested: 8945,
    createdBy: 1,
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-02-28T12:00:00Z',
  },
  {
    id: 5,
    name: 'DIV IRC Network',
    sourceType: 'irc_server',
    isEnabled: false,
    config: { host: 'irc-div.keystone.usmc.mil', port: 6667, useSsl: false, nick: 'KEY-DIV', channels: ['#div-ops'], bufferSeconds: 60 },
    status: 'disconnected',
    lastRun: null,
    lastError: 'Connection refused: irc-div.keystone.usmc.mil:6667',
    filesProcessed: 0,
    recordsIngested: 0,
    createdBy: 1,
    createdAt: '2026-02-25T00:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
];

const DEMO_PROCESSED_FILES: ProcessedFile[] = [
  { id: 1, dataSourceId: 1, filePath: '/data/mirc/bn-s4/20260303_s4net.log', fileHash: 'a1b2c3d4', recordsExtracted: 34, processedAt: new Date(Date.now() - 120000).toISOString() },
  { id: 2, dataSourceId: 1, filePath: '/data/mirc/bn-s4/20260302_s4net.log', fileHash: 'e5f6a7b8', recordsExtracted: 28, processedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, dataSourceId: 3, filePath: '/data/gcss-mc/exports/logstat_20260303.xlsx', fileHash: 'c9d0e1f2', recordsExtracted: 42, processedAt: new Date(Date.now() - 300000).toISOString() },
];

const mockDelay = (ms = 200 + Math.random() * 200): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

// --- API Functions ---

export async function getDataSources(params?: { sourceType?: DataSourceType; isEnabled?: boolean }): Promise<DataSource[]> {
  if (isDemoMode) {
    await mockDelay();
    let sources = [...DEMO_DATA_SOURCES];
    if (params?.sourceType) sources = sources.filter(s => s.sourceType === params.sourceType);
    if (params?.isEnabled !== undefined) sources = sources.filter(s => s.isEnabled === params.isEnabled);
    return sources;
  }
  const response = await apiClient.get<DataSource[]>('/data-sources', { params });
  return response.data;
}

export async function createDataSource(data: DataSourceCreate): Promise<DataSource> {
  if (isDemoMode) {
    await mockDelay();
    return { ...DEMO_DATA_SOURCES[0], ...data, config: data.config as unknown as DataSourceConfig, id: Date.now(), status: 'inactive', filesProcessed: 0, recordsIngested: 0, lastRun: null, lastError: null, createdAt: new Date().toISOString(), updatedAt: null, createdBy: 1 };
  }
  const response = await apiClient.post<DataSource>('/data-sources', data);
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
  if (isDemoMode) { await mockDelay(); return DEMO_PROCESSED_FILES.filter(f => f.dataSourceId === sourceId); }
  const response = await apiClient.get<ProcessedFile[]>(`/data-sources/${sourceId}/processed-files`);
  return response.data;
}
