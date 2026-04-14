import apiClient from './client';
import { isDemoMode } from './mockClient';

// --- Types ---

export interface TAKConnection {
  id: number;
  name: string;
  host: string;
  port: number;
  protocol: 'tcp' | 'ssl' | 'http';
  apiPort: number;
  useTls: boolean;
  certFile: string | null;
  apiToken: string | null;
  unitId: number | null;
  cotTypesFilter: string[] | null;
  channelFilter: string | null;
  isActive: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'polling';
  lastConnected: string | null;
  lastError: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface TAKConnectionCreate {
  name: string;
  host: string;
  port?: number;
  protocol?: 'tcp' | 'ssl' | 'http';
  apiPort?: number;
  useTls?: boolean;
  certFile?: string;
  apiToken?: string;
  unitId?: number;
  cotTypesFilter?: string[];
  channelFilter?: string;
  isActive?: boolean;
}

export interface TAKConnectionUpdate {
  name?: string;
  host?: string;
  port?: number;
  protocol?: 'tcp' | 'ssl' | 'http';
  apiPort?: number;
  useTls?: boolean;
  certFile?: string;
  apiToken?: string;
  unitId?: number;
  cotTypesFilter?: string[];
  channelFilter?: string;
  isActive?: boolean;
}

export interface TAKConnectionStatus {
  connectionId: number;
  name: string;
  status: string;
  connectedAt: string | null;
  lastPoll: string | null;
  lastError: string | null;
  messagesReceived: number;
}

export interface TAKTestResult {
  success: boolean;
  statusCode: number | null;
  latencyMs: number | null;
  serverInfo: string | null;
  message: string;
}

export interface TAKMessage {
  id: number;
  uid: string | null;
  callsign: string | null;
  channel: string | null;
  contentPreview: string | null;
  confidence: number;
  status: string;
  receivedAt: string | null;
}

export interface COTIngestResponse {
  success: boolean;
  message: string;
  parsed: Record<string, unknown> | null;
  errors: string[] | null;
}

// --- Demo mock data for TAK ---

const DEMO_TAK_CONNECTION: TAKConnection = {
  id: 1,
  name: 'TAK Server Alpha',
  host: 'tak-alpha.keystone.usmc.mil',
  port: 8089,
  protocol: 'ssl',
  apiPort: 8443,
  useTls: true,
  certFile: '/certs/tak-alpha.pem',
  apiToken: null,
  unitId: 4,
  cotTypesFilter: ['a-f-G', 'b-m-p-s-m'],
  channelFilter: null,
  isActive: true,
  connectionStatus: 'connected',
  lastConnected: new Date().toISOString(),
  lastError: null,
  createdBy: 1,
  createdAt: '2026-02-15T00:00:00Z',
  updatedAt: '2026-03-01T12:00:00Z',
};

const DEMO_TAK_MESSAGES: TAKMessage[] = [
  { id: 1, uid: 'ALPHA-6', callsign: 'ALPHA-6', channel: 'BN TAC 1', contentPreview: 'Position update: Grid 38SMB 4823 1567', confidence: 0.95, status: 'PARSED', receivedAt: new Date(Date.now() - 300000).toISOString() },
  { id: 2, uid: 'BRAVO-6', callsign: 'BRAVO-6', channel: 'BN TAC 1', contentPreview: 'LOGPAC request: CL III emergency resupply', confidence: 0.88, status: 'PARSED', receivedAt: new Date(Date.now() - 600000).toISOString() },
  { id: 3, uid: 'FST-11', callsign: 'STEEL RAIN', channel: 'FIRES NET', contentPreview: 'Fire mission complete. BDA pending.', confidence: 0.92, status: 'PARSED', receivedAt: new Date(Date.now() - 900000).toISOString() },
];

const mockDelay = (ms = 200 + Math.random() * 200): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

// --- API Functions ---

export async function getTAKConnections(): Promise<TAKConnection[]> {
  if (isDemoMode) { await mockDelay(); return [DEMO_TAK_CONNECTION]; }
  const response = await apiClient.get<TAKConnection[]>('/tak/connections');
  return response.data;
}

export async function createConnection(data: TAKConnectionCreate): Promise<TAKConnection> {
  if (isDemoMode) { await mockDelay(); return { ...DEMO_TAK_CONNECTION, ...data, id: Date.now() }; }
  const response = await apiClient.post<TAKConnection>('/tak/connections', data);
  return response.data;
}

export async function updateConnection(
  id: number,
  data: TAKConnectionUpdate,
): Promise<TAKConnection> {
  if (isDemoMode) { await mockDelay(); return { ...DEMO_TAK_CONNECTION, ...data, id }; }
  const response = await apiClient.put<TAKConnection>(`/tak/connections/${id}`, data);
  return response.data;
}

export async function deleteConnection(id: number): Promise<void> {
  if (isDemoMode) { await mockDelay(); void id; return; }
  await apiClient.delete(`/tak/connections/${id}`);
}

export async function testConnection(id: number): Promise<TAKTestResult> {
  if (isDemoMode) { await mockDelay(); void id; return { success: true, statusCode: 200, latencyMs: 45, serverInfo: 'TAK Server 4.8.0 (Demo)', message: 'Connection successful' }; }
  const response = await apiClient.post<TAKTestResult>(`/tak/connections/${id}/test`);
  return response.data;
}

export async function startPolling(id: number): Promise<{ status: string; message: string }> {
  if (isDemoMode) { await mockDelay(); void id; return { status: 'polling', message: 'Polling started (demo)' }; }
  const response = await apiClient.post<{ status: string; message: string }>(
    `/tak/connections/${id}/start`,
  );
  return response.data;
}

export async function stopPolling(id: number): Promise<{ status: string; message: string }> {
  if (isDemoMode) { await mockDelay(); void id; return { status: 'disconnected', message: 'Polling stopped (demo)' }; }
  const response = await apiClient.post<{ status: string; message: string }>(
    `/tak/connections/${id}/stop`,
  );
  return response.data;
}

export async function getConnectionStatus(id: number): Promise<TAKConnectionStatus> {
  if (isDemoMode) { await mockDelay(); return { connectionId: id, name: DEMO_TAK_CONNECTION.name, status: 'connected', connectedAt: DEMO_TAK_CONNECTION.lastConnected, lastPoll: new Date().toISOString(), lastError: null, messagesReceived: 47 }; }
  const response = await apiClient.get<TAKConnectionStatus>(`/tak/connections/${id}/status`);
  return response.data;
}

export async function getRecentMessages(id: number, limit = 20): Promise<TAKMessage[]> {
  if (isDemoMode) { await mockDelay(); void id; return DEMO_TAK_MESSAGES.slice(0, limit); }
  const response = await apiClient.get<TAKMessage[]>(`/tak/connections/${id}/messages`, {
    params: { limit },
  });
  return response.data;
}

export async function submitCOTMessage(
  xmlContent: string,
  connectionId?: number,
): Promise<COTIngestResponse> {
  if (isDemoMode) { await mockDelay(); void connectionId; return { success: true, message: 'CoT message ingested (demo)', parsed: { type: 'a-f-G', uid: 'DEMO-' + Date.now(), content: xmlContent.substring(0, 100) }, errors: null }; }
  const response = await apiClient.post<COTIngestResponse>('/tak/ingest/cot', {
    xmlContent: xmlContent,
    connectionId: connectionId,
  });
  return response.data;
}
