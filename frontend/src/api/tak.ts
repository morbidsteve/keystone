import apiClient from './client';
import { isDemoMode } from './mockClient';

// --- Types ---

export interface TAKConnection {
  id: number;
  name: string;
  host: string;
  port: number;
  protocol: 'tcp' | 'ssl' | 'http';
  api_port: number;
  use_tls: boolean;
  cert_file: string | null;
  api_token: string | null;
  unit_id: number | null;
  cot_types_filter: string[] | null;
  channel_filter: string | null;
  is_active: boolean;
  connection_status: 'connected' | 'disconnected' | 'error' | 'polling';
  last_connected: string | null;
  last_error: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface TAKConnectionCreate {
  name: string;
  host: string;
  port?: number;
  protocol?: 'tcp' | 'ssl' | 'http';
  api_port?: number;
  use_tls?: boolean;
  cert_file?: string;
  api_token?: string;
  unit_id?: number;
  cot_types_filter?: string[];
  channel_filter?: string;
  is_active?: boolean;
}

export interface TAKConnectionUpdate {
  name?: string;
  host?: string;
  port?: number;
  protocol?: 'tcp' | 'ssl' | 'http';
  api_port?: number;
  use_tls?: boolean;
  cert_file?: string;
  api_token?: string;
  unit_id?: number;
  cot_types_filter?: string[];
  channel_filter?: string;
  is_active?: boolean;
}

export interface TAKConnectionStatus {
  connection_id: number;
  name: string;
  status: string;
  connected_at: string | null;
  last_poll: string | null;
  last_error: string | null;
  messages_received: number;
}

export interface TAKTestResult {
  success: boolean;
  status_code: number | null;
  latency_ms: number | null;
  server_info: string | null;
  message: string;
}

export interface TAKMessage {
  id: number;
  uid: string | null;
  callsign: string | null;
  channel: string | null;
  content_preview: string | null;
  confidence: number;
  status: string;
  received_at: string | null;
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
  api_port: 8443,
  use_tls: true,
  cert_file: '/certs/tak-alpha.pem',
  api_token: null,
  unit_id: 4,
  cot_types_filter: ['a-f-G', 'b-m-p-s-m'],
  channel_filter: null,
  is_active: true,
  connection_status: 'connected',
  last_connected: new Date().toISOString(),
  last_error: null,
  created_by: 1,
  created_at: '2026-02-15T00:00:00Z',
  updated_at: '2026-03-01T12:00:00Z',
};

const DEMO_TAK_MESSAGES: TAKMessage[] = [
  { id: 1, uid: 'ALPHA-6', callsign: 'ALPHA-6', channel: 'BN TAC 1', content_preview: 'Position update: Grid 38SMB 4823 1567', confidence: 0.95, status: 'PARSED', received_at: new Date(Date.now() - 300000).toISOString() },
  { id: 2, uid: 'BRAVO-6', callsign: 'BRAVO-6', channel: 'BN TAC 1', content_preview: 'LOGPAC request: CL III emergency resupply', confidence: 0.88, status: 'PARSED', received_at: new Date(Date.now() - 600000).toISOString() },
  { id: 3, uid: 'FST-11', callsign: 'STEEL RAIN', channel: 'FIRES NET', content_preview: 'Fire mission complete. BDA pending.', confidence: 0.92, status: 'PARSED', received_at: new Date(Date.now() - 900000).toISOString() },
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
  if (isDemoMode) { await mockDelay(); void id; return { success: true, status_code: 200, latency_ms: 45, server_info: 'TAK Server 4.8.0 (Demo)', message: 'Connection successful' }; }
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
  if (isDemoMode) { await mockDelay(); return { connection_id: id, name: DEMO_TAK_CONNECTION.name, status: 'connected', connected_at: DEMO_TAK_CONNECTION.last_connected, last_poll: new Date().toISOString(), last_error: null, messages_received: 47 }; }
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
    xml_content: xmlContent,
    connection_id: connectionId,
  });
  return response.data;
}
