import { useState, useEffect, useCallback } from 'react';
import {
  Radio,
  Plus,
  Trash2,
  Play,
  Square,
  Zap,
  Settings,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  Loader,
  Server,
  Clock,
  MessageSquare,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import StatusDot from '@/components/ui/StatusDot';
import { formatRelativeTime } from '@/lib/utils';
import type {
  TAKConnection,
  TAKConnectionCreate,
  TAKMessage,
  TAKTestResult,
} from '@/api/tak';
import {
  getTAKConnections,
  createConnection,
  updateConnection,
  deleteConnection,
  testConnection,
  startPolling,
  stopPolling,
  getConnectionStatus,
  getRecentMessages,
} from '@/api/tak';

// --- Sub-components ---

function ConnectionStatusPill({ status }: { status: string }) {
  const statusMap: Record<string, { dot: string; label: string; color: string }> = {
    connected: { dot: 'GREEN', label: 'CONNECTED', color: 'var(--color-success)' },
    polling: { dot: 'GREEN', label: 'POLLING', color: 'var(--color-success)' },
    disconnected: { dot: 'RED', label: 'DISCONNECTED', color: 'var(--color-danger)' },
    error: { dot: 'AMBER', label: 'ERROR', color: 'var(--color-warning)' },
  };

  const info = statusMap[status] || statusMap.disconnected;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        borderRadius: 2,
        border: `1px solid ${info.color}`,
        backgroundColor: `${info.color}15`,
      }}
    >
      <StatusDot status={info.dot} size={6} pulse={status === 'connected' || status === 'polling'} />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          fontWeight: 500,
          color: info.color,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        {info.label}
      </span>
    </span>
  );
}

function ConnectionForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: TAKConnection;
  onSubmit: (data: TAKConnectionCreate) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [host, setHost] = useState(initial?.host || '');
  const [port, setPort] = useState(initial?.port || 8089);
  const [protocol, setProtocol] = useState<'tcp' | 'ssl' | 'http'>(initial?.protocol || 'tcp');
  const [apiPort, setApiPort] = useState(initial?.api_port || 8443);
  const [useTls, setUseTls] = useState(initial?.use_tls ?? true);
  const [apiToken, setApiToken] = useState(initial?.api_token || '');
  const [certFile, setCertFile] = useState(initial?.cert_file || '');
  const [channelFilter, setChannelFilter] = useState(initial?.channel_filter || '');
  const [cotTypesFilter, setCotTypesFilter] = useState(
    initial?.cot_types_filter?.join(', ') || '',
  );

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
    marginBottom: 4,
    display: 'block',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filters = cotTypesFilter
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onSubmit({
      name,
      host,
      port,
      protocol,
      api_port: apiPort,
      use_tls: useTls,
      api_token: apiToken || undefined,
      cert_file: certFile || undefined,
      channel_filter: channelFilter || undefined,
      cot_types_filter: filters.length > 0 ? filters : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {/* Name */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>CONNECTION NAME</label>
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., 1st Marines TAK Server"
            required
          />
        </div>

        {/* Host */}
        <div>
          <label style={labelStyle}>HOST / IP</label>
          <input
            style={inputStyle}
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="tak.example.mil"
            required
          />
        </div>

        {/* Protocol */}
        <div>
          <label style={labelStyle}>PROTOCOL</label>
          <select
            style={inputStyle}
            value={protocol}
            onChange={(e) => setProtocol(e.target.value as 'tcp' | 'ssl' | 'http')}
          >
            <option value="tcp">TCP</option>
            <option value="ssl">SSL</option>
            <option value="http">HTTP</option>
          </select>
        </div>

        {/* Port */}
        <div>
          <label style={labelStyle}>COT PORT</label>
          <input
            style={inputStyle}
            type="number"
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
            min={1}
            max={65535}
          />
        </div>

        {/* API Port */}
        <div>
          <label style={labelStyle}>API PORT</label>
          <input
            style={inputStyle}
            type="number"
            value={apiPort}
            onChange={(e) => setApiPort(Number(e.target.value))}
            min={1}
            max={65535}
          />
        </div>

        {/* TLS */}
        <div>
          <label style={labelStyle}>USE TLS</label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 0',
            }}
          >
            <input
              type="checkbox"
              checked={useTls}
              onChange={(e) => setUseTls(e.target.checked)}
              style={{ accentColor: 'var(--color-accent)' }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text)',
              }}
            >
              {useTls ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* API Token */}
        <div>
          <label style={labelStyle}>API TOKEN</label>
          <input
            style={inputStyle}
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="Optional"
          />
        </div>

        {/* Cert File */}
        <div>
          <label style={labelStyle}>CLIENT CERT PATH</label>
          <input
            style={inputStyle}
            value={certFile}
            onChange={(e) => setCertFile(e.target.value)}
            placeholder="/etc/certs/client.pem"
          />
        </div>

        {/* Channel Filter */}
        <div>
          <label style={labelStyle}>CHANNEL FILTER</label>
          <input
            style={inputStyle}
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            placeholder="e.g., 1st Marines"
          />
        </div>

        {/* CoT Types Filter */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>COT TYPE FILTERS (COMMA SEPARATED)</label>
          <input
            style={inputStyle}
            value={cotTypesFilter}
            onChange={(e) => setCotTypesFilter(e.target.value)}
            placeholder='e.g., a-f-G-.*, b-r-.*, b-m-p-s-p-loc'
          />
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--color-text-muted)',
              marginTop: 4,
            }}
          >
            Leave empty to receive all CoT types. Uses regex patterns.
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          CANCEL
        </button>
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--color-accent)',
            border: 'none',
            borderRadius: 'var(--radius)',
            color: 'var(--color-bg)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {initial ? 'UPDATE' : 'CREATE'} CONNECTION
        </button>
      </div>
    </form>
  );
}

function MessageFeed({ messages }: { messages: TAKMessage[] }) {
  if (messages.length === 0) {
    return (
      <div
        style={{
          padding: '24px 16px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
        }}
      >
        NO MESSAGES RECEIVED
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' }}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 10px',
            backgroundColor: 'var(--color-bg-surface)',
            borderRadius: 'var(--radius)',
            transition: 'background-color var(--transition)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)')}
        >
          <MessageSquare size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {msg.callsign || msg.uid || 'Unknown'}
            </div>
            {msg.content_preview && (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  marginTop: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {msg.content_preview}
              </div>
            )}
          </div>
          {msg.channel && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--color-info)',
                whiteSpace: 'nowrap',
              }}
            >
              {msg.channel}
            </span>
          )}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--color-text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            {msg.received_at ? formatRelativeTime(msg.received_at) : '--'}
          </span>
        </div>
      ))}
    </div>
  );
}

// --- Main Component ---

export default function TAKManager() {
  const [connections, setConnections] = useState<TAKConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState<TAKConnection | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [messages, setMessages] = useState<TAKMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<TAKTestResult | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTAKConnections();
      setConnections(data);
    } catch (err) {
      setError('Failed to load TAK connections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Fetch messages when a connection is selected
  useEffect(() => {
    if (selectedConnection === null) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    async function fetchMessages() {
      setMessagesLoading(true);
      try {
        const data = await getRecentMessages(selectedConnection!, 20);
        if (!cancelled) setMessages(data);
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    }
    fetchMessages();
    return () => { cancelled = true; };
  }, [selectedConnection]);

  const handleCreate = async (data: TAKConnectionCreate) => {
    try {
      await createConnection(data);
      setShowForm(false);
      await fetchConnections();
    } catch (err) {
      setError('Failed to create connection');
    }
  };

  const handleUpdate = async (data: TAKConnectionCreate) => {
    if (!editingConnection) return;
    try {
      await updateConnection(editingConnection.id, data);
      setEditingConnection(null);
      await fetchConnections();
    } catch (err) {
      setError('Failed to update connection');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteConnection(id);
      if (selectedConnection === id) {
        setSelectedConnection(null);
      }
      await fetchConnections();
    } catch (err) {
      setError('Failed to delete connection');
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const result = await testConnection(id);
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        status_code: null,
        latency_ms: null,
        server_info: null,
        message: 'Test request failed',
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleTogglePolling = async (conn: TAKConnection) => {
    setTogglingId(conn.id);
    try {
      if (conn.connection_status === 'connected' || conn.connection_status === 'polling') {
        await stopPolling(conn.id);
      } else {
        await startPolling(conn.id);
      }
      await fetchConnections();
    } catch (err) {
      setError('Failed to toggle polling');
    } finally {
      setTogglingId(null);
    }
  };

  // Render form view
  if (showForm || editingConnection) {
    return (
      <Card title={editingConnection ? 'EDIT TAK CONNECTION' : 'NEW TAK CONNECTION'}>
        <ConnectionForm
          initial={editingConnection || undefined}
          onSubmit={editingConnection ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingConnection(null);
          }}
        />
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title="TAK SERVERS"
        headerRight={
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              backgroundColor: 'var(--color-accent)',
              border: 'none',
              borderRadius: 'var(--radius)',
              color: 'var(--color-bg)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            <Plus size={12} />
            ADD
          </button>
        }
      >
        {/* Error Banner */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius)',
              marginBottom: 12,
            }}
          >
            <AlertTriangle size={14} style={{ color: 'var(--color-danger)' }} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-danger)',
                flex: 1,
              }}
            >
              {error}
            </span>
            <button
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 2 }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Test Result Banner */}
        {testResult && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              backgroundColor: testResult.success
                ? 'rgba(64, 192, 87, 0.1)'
                : 'rgba(255, 107, 107, 0.1)',
              border: `1px solid ${testResult.success ? 'var(--color-success)' : 'var(--color-danger)'}`,
              borderRadius: 'var(--radius)',
              marginBottom: 12,
            }}
          >
            {testResult.success ? (
              <Check size={14} style={{ color: 'var(--color-success)' }} />
            ) : (
              <AlertTriangle size={14} style={{ color: 'var(--color-danger)' }} />
            )}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: testResult.success ? 'var(--color-success)' : 'var(--color-danger)',
                }}
              >
                {testResult.message}
              </div>
              {testResult.latency_ms !== null && (
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                    marginTop: 2,
                  }}
                >
                  Latency: {testResult.latency_ms}ms
                  {testResult.status_code && ` | HTTP ${testResult.status_code}`}
                </div>
              )}
            </div>
            <button
              onClick={() => setTestResult(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: 2,
              }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 32,
              color: 'var(--color-text-muted)',
            }}
          >
            <Loader size={16} className="animate-spin" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>LOADING...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && connections.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: 32,
            }}
          >
            <Server size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--color-text)',
                marginBottom: 4,
              }}
            >
              NO TAK SERVERS CONFIGURED
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-muted)',
                marginBottom: 16,
              }}
            >
              Add a TAK server connection to begin ingesting CoT data
            </div>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--color-accent)',
                border: 'none',
                borderRadius: 'var(--radius)',
                color: 'var(--color-bg)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              ADD CONNECTION
            </button>
          </div>
        )}

        {/* Connection List */}
        {!loading && connections.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {connections.map((conn) => (
              <div
                key={conn.id}
                style={{
                  padding: '10px 12px',
                  backgroundColor:
                    selectedConnection === conn.id
                      ? 'var(--color-bg-hover)'
                      : 'var(--color-bg-surface)',
                  border:
                    selectedConnection === conn.id
                      ? '1px solid var(--color-accent)'
                      : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                }}
                onClick={() =>
                  setSelectedConnection(selectedConnection === conn.id ? null : conn.id)
                }
                onMouseEnter={(e) => {
                  if (selectedConnection !== conn.id) {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedConnection !== conn.id) {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                  }
                }}
              >
                {/* Connection header row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Radio size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--color-text-bright)',
                      }}
                    >
                      {conn.name}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--color-text-muted)',
                        marginTop: 2,
                      }}
                    >
                      {conn.host}:{conn.api_port} ({conn.protocol.toUpperCase()})
                    </div>
                  </div>
                  <ConnectionStatusPill status={conn.connection_status} />
                </div>

                {/* Actions row (visible when selected) */}
                {selectedConnection === conn.id && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: '1px solid var(--color-border)',
                    }}
                  >
                    {/* Test button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTest(conn.id);
                      }}
                      disabled={testingId === conn.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--color-border-strong)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--color-text)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        cursor: 'pointer',
                        opacity: testingId === conn.id ? 0.5 : 1,
                      }}
                    >
                      {testingId === conn.id ? (
                        <Loader size={10} className="animate-spin" />
                      ) : (
                        <Zap size={10} />
                      )}
                      TEST
                    </button>

                    {/* Start/Stop Polling */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePolling(conn);
                      }}
                      disabled={togglingId === conn.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        border: `1px solid ${
                          conn.connection_status === 'connected'
                            ? 'var(--color-danger)'
                            : 'var(--color-success)'
                        }`,
                        borderRadius: 'var(--radius)',
                        color:
                          conn.connection_status === 'connected'
                            ? 'var(--color-danger)'
                            : 'var(--color-success)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        cursor: 'pointer',
                        opacity: togglingId === conn.id ? 0.5 : 1,
                      }}
                    >
                      {togglingId === conn.id ? (
                        <Loader size={10} className="animate-spin" />
                      ) : conn.connection_status === 'connected' ||
                        conn.connection_status === 'polling' ? (
                        <Square size={10} />
                      ) : (
                        <Play size={10} />
                      )}
                      {conn.connection_status === 'connected' ||
                      conn.connection_status === 'polling'
                        ? 'STOP'
                        : 'START'}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingConnection(conn);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--color-border-strong)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--color-text)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        cursor: 'pointer',
                      }}
                    >
                      <Settings size={10} />
                      EDIT
                    </button>

                    <div style={{ flex: 1 }} />

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(conn.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--color-danger)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--color-danger)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={10} />
                      DELETE
                    </button>
                  </div>
                )}

                {/* Error display */}
                {conn.last_error && selectedConnection === conn.id && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 6,
                      marginTop: 8,
                      padding: '6px 8px',
                      backgroundColor: 'rgba(255, 107, 107, 0.08)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <AlertTriangle
                      size={11}
                      style={{
                        color: 'var(--color-warning)',
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--color-warning)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {conn.last_error}
                    </span>
                  </div>
                )}

                {/* Connection metadata */}
                {selectedConnection === conn.id && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      marginTop: 8,
                    }}
                  >
                    {conn.last_connected && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} style={{ color: 'var(--color-text-muted)' }} />
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          Last: {formatRelativeTime(conn.last_connected)}
                        </span>
                      </div>
                    )}
                    {conn.channel_filter && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          color: 'var(--color-info)',
                        }}
                      >
                        CH: {conn.channel_filter}
                      </span>
                    )}
                    {conn.cot_types_filter && conn.cot_types_filter.length > 0 && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {conn.cot_types_filter.length} filter(s)
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Messages Feed */}
      {selectedConnection !== null && (
        <Card
          title="RECENT COT MESSAGES"
          headerRight={
            <button
              onClick={() => {
                setMessagesLoading(true);
                getRecentMessages(selectedConnection, 20)
                  .then(setMessages)
                  .catch(() => setMessages([]))
                  .finally(() => setMessagesLoading(false));
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 'var(--radius)',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={10} className={messagesLoading ? 'animate-spin' : ''} />
              REFRESH
            </button>
          }
        >
          {messagesLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: 24,
                color: 'var(--color-text-muted)',
              }}
            >
              <Loader size={14} className="animate-spin" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>LOADING...</span>
            </div>
          ) : (
            <MessageFeed messages={messages} />
          )}
        </Card>
      )}
    </div>
  );
}
