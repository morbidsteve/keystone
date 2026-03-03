import apiClient from './client';

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

// --- API Functions ---

export async function getTAKConnections(): Promise<TAKConnection[]> {
  const response = await apiClient.get<TAKConnection[]>('/tak/connections');
  return response.data;
}

export async function createConnection(data: TAKConnectionCreate): Promise<TAKConnection> {
  const response = await apiClient.post<TAKConnection>('/tak/connections', data);
  return response.data;
}

export async function updateConnection(
  id: number,
  data: TAKConnectionUpdate,
): Promise<TAKConnection> {
  const response = await apiClient.put<TAKConnection>(`/tak/connections/${id}`, data);
  return response.data;
}

export async function deleteConnection(id: number): Promise<void> {
  await apiClient.delete(`/tak/connections/${id}`);
}

export async function testConnection(id: number): Promise<TAKTestResult> {
  const response = await apiClient.post<TAKTestResult>(`/tak/connections/${id}/test`);
  return response.data;
}

export async function startPolling(id: number): Promise<{ status: string; message: string }> {
  const response = await apiClient.post<{ status: string; message: string }>(
    `/tak/connections/${id}/start`,
  );
  return response.data;
}

export async function stopPolling(id: number): Promise<{ status: string; message: string }> {
  const response = await apiClient.post<{ status: string; message: string }>(
    `/tak/connections/${id}/stop`,
  );
  return response.data;
}

export async function getConnectionStatus(id: number): Promise<TAKConnectionStatus> {
  const response = await apiClient.get<TAKConnectionStatus>(`/tak/connections/${id}/status`);
  return response.data;
}

export async function getRecentMessages(id: number, limit = 20): Promise<TAKMessage[]> {
  const response = await apiClient.get<TAKMessage[]>(`/tak/connections/${id}/messages`, {
    params: { limit },
  });
  return response.data;
}

export async function submitCOTMessage(
  xmlContent: string,
  connectionId?: number,
): Promise<COTIngestResponse> {
  const response = await apiClient.post<COTIngestResponse>('/tak/ingest/cot', {
    xml_content: xmlContent,
    connection_id: connectionId,
  });
  return response.data;
}
