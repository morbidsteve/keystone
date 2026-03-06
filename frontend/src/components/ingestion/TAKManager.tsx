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
      className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-[2px]" style={{ border: `1px solid ${info.color}`, backgroundColor: `${info.color}15` }}
    >
      <StatusDot status={info.dot} size={6} pulse={status === 'connected' || status === 'polling'} />
      <span
        className="font-[var(--font-mono)] text-[9px] font-medium uppercase tracking-[1px]" style={{ color: info.color }}
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
        className="grid gap-3 mb-4 grid-cols-2"
      >
        {/* Name */}
        <div className="col-span-full">
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
            className="flex items-center gap-2 py-2 px-0"
          >
            <input
              type="checkbox"
              checked={useTls}
              onChange={(e) => setUseTls(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            <span
              className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)]"
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
        <div className="col-span-full">
          <label style={labelStyle}>COT TYPE FILTERS (COMMA SEPARATED)</label>
          <input
            style={inputStyle}
            value={cotTypesFilter}
            onChange={(e) => setCotTypesFilter(e.target.value)}
            placeholder='e.g., a-f-G-.*, b-r-.*, b-m-p-s-p-loc'
          />
          <div
            className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mt-1"
          >
            Leave empty to receive all CoT types. Uses regex patterns.
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="py-2 px-4 bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text-muted)] font-[var(--font-mono)] text-[11px] font-semibold tracking-[1px] uppercase cursor-pointer"
        >
          CANCEL
        </button>
        <button
          type="submit"
          className="py-2 px-4 bg-[var(--color-accent)] border-0 rounded-[var(--radius)] text-[var(--color-bg)] font-[var(--font-mono)] text-[11px] font-semibold tracking-[1px] uppercase cursor-pointer"
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
        className="py-6 px-4 text-center text-[var(--color-text-muted)] font-[var(--font-mono)] text-[11px]"
      >
        NO MESSAGES RECEIVED
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className="flex items-center gap-2.5 py-1.5 px-2.5 bg-[var(--color-bg-surface)] rounded-[var(--radius)] transition-colors duration-[var(--transition)]"
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)')}
        >
          <MessageSquare size={12} className="text-[var(--color-accent)] shrink-0" />
          <div className="flex-1 min-w-0">
            <div
              className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              {msg.callsign || msg.uid || 'Unknown'}
            </div>
            {msg.content_preview && (
              <div
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mt-px whitespace-nowrap overflow-hidden text-ellipsis"
              >
                {msg.content_preview}
              </div>
            )}
          </div>
          {msg.channel && (
            <span
              className="font-[var(--font-mono)] text-[9px] text-[var(--color-info)] whitespace-nowrap"
            >
              {msg.channel}
            </span>
          )}
          <span
            className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] whitespace-nowrap"
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
    <div className="flex flex-col gap-4">
      <Card
        title="TAK SERVERS"
        headerRight={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 py-1 px-2.5 bg-[var(--color-accent)] border-0 rounded-[var(--radius)] text-[var(--color-bg)] font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] uppercase cursor-pointer"
          >
            <Plus size={12} />
            ADD
          </button>
        }
      >
        {/* Error Banner */}
        {error && (
          <div
            className="flex items-center gap-2 py-2 px-3 bg-[rgba(255,107,107,0.1)] border border-[var(--color-danger)] rounded-[var(--radius)] mb-3"
          >
            <AlertTriangle size={14} className="text-[var(--color-danger)]" />
            <span
              className="font-[var(--font-mono)] text-[11px] text-[var(--color-danger)] flex-1"
            >
              {error}
            </span>
            <button
              onClick={() => setError(null)}
              className="bg-transparent border-0 cursor-pointer text-[var(--color-danger)] p-0.5"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Test Result Banner */}
        {testResult && (
          <div
            className="flex items-center gap-2 py-2 px-3 rounded-[var(--radius)] mb-3" style={{ backgroundColor: testResult.success
                ? 'rgba(64, 192, 87, 0.1)'
                : 'rgba(255, 107, 107, 0.1)', border: `1px solid ${testResult.success ? 'var(--color-success)' : 'var(--color-danger)'}` }}
          >
            {testResult.success ? (
              <Check size={14} className="text-[var(--color-success)]" />
            ) : (
              <AlertTriangle size={14} className="text-[var(--color-danger)]" />
            )}
            <div className="flex-1">
              <div
                className="font-[var(--font-mono)] text-[11px]" style={{ color: testResult.success ? 'var(--color-success)' : 'var(--color-danger)' }}
              >
                {testResult.message}
              </div>
              {testResult.latency_ms !== null && (
                <div
                  className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mt-0.5"
                >
                  Latency: {testResult.latency_ms}ms
                  {testResult.status_code && ` | HTTP ${testResult.status_code}`}
                </div>
              )}
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="bg-transparent border-0 cursor-pointer text-[var(--color-text-muted)] p-0.5"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div
            className="flex items-center justify-center gap-2 p-8 text-[var(--color-text-muted)]"
          >
            <Loader size={16} className="animate-spin" />
            <span className="font-[var(--font-mono)] text-[11px]">LOADING...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && connections.length === 0 && (
          <div
            className="text-center p-8"
          >
            <Server size={32} className="text-[var(--color-text-muted)] mb-2" />
            <div
              className="font-[var(--font-mono)] text-xs text-[var(--color-text)] mb-1"
            >
              NO TAK SERVERS CONFIGURED
            </div>
            <div
              className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-4"
            >
              Add a TAK server connection to begin ingesting CoT data
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="py-2 px-4 bg-[var(--color-accent)] border-0 rounded-[var(--radius)] text-[var(--color-bg)] font-[var(--font-mono)] text-[11px] font-semibold tracking-[1px] uppercase cursor-pointer"
            >
              ADD CONNECTION
            </button>
          </div>
        )}

        {/* Connection List */}
        {!loading && connections.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="py-2.5 px-3 rounded-[var(--radius)] cursor-pointer" style={{ backgroundColor: selectedConnection === conn.id
                      ? 'var(--color-bg-hover)'
                      : 'var(--color-bg-surface)', border: selectedConnection === conn.id
                      ? '1px solid var(--color-accent)'
                      : '1px solid var(--color-border)', transition: 'all var(--transition)' }}
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
                  className="flex items-center gap-2.5"
                >
                  <Radio size={14} className="text-[var(--color-accent)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-[var(--font-mono)] text-xs font-semibold text-[var(--color-text-bright)]"
                    >
                      {conn.name}
                    </div>
                    <div
                      className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mt-0.5"
                    >
                      {conn.host}:{conn.api_port} ({conn.protocol.toUpperCase()})
                    </div>
                  </div>
                  <ConnectionStatusPill status={conn.connection_status} />
                </div>

                {/* Actions row (visible when selected) */}
                {selectedConnection === conn.id && (
                  <div
                    className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-t-[var(--color-border)]"
                  >
                    {/* Test button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTest(conn.id);
                      }}
                      disabled={testingId === conn.id}
                      className="flex items-center gap-1 py-1 px-2 bg-transparent border border-[var(--color-border-strong)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[10px] cursor-pointer" style={{ opacity: testingId === conn.id ? 0.5 : 1 }}
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
                      className="flex items-center gap-1 py-1 px-2 bg-transparent rounded-[var(--radius)] font-[var(--font-mono)] text-[10px] cursor-pointer" style={{ border: `1px solid ${
                          conn.connection_status === 'connected'
                            ? 'var(--color-danger)'
                            : 'var(--color-success)'
                        }`, color: conn.connection_status === 'connected'
                            ? 'var(--color-danger)'
                            : 'var(--color-success)', opacity: togglingId === conn.id ? 0.5 : 1 }}
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
                      className="flex items-center gap-1 py-1 px-2 bg-transparent border border-[var(--color-border-strong)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[10px] cursor-pointer"
                    >
                      <Settings size={10} />
                      EDIT
                    </button>

                    <div className="flex-1" />

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(conn.id);
                      }}
                      className="flex items-center gap-1 py-1 px-2 bg-transparent border border-[var(--color-danger)] rounded-[var(--radius)] text-[var(--color-danger)] font-[var(--font-mono)] text-[10px] cursor-pointer"
                    >
                      <Trash2 size={10} />
                      DELETE
                    </button>
                  </div>
                )}

                {/* Error display */}
                {conn.last_error && selectedConnection === conn.id && (
                  <div
                    className="flex items-start gap-1.5 mt-2 py-1.5 px-2 bg-[rgba(255,107,107,0.08)] rounded-[var(--radius)]"
                  >
                    <AlertTriangle
                      size={11}
                      className="text-[var(--color-warning)] shrink-0 mt-px"
                    />
                    <span
                      className="font-[var(--font-mono)] text-[10px] text-[var(--color-warning)] break-words"
                    >
                      {conn.last_error}
                    </span>
                  </div>
                )}

                {/* Connection metadata */}
                {selectedConnection === conn.id && (
                  <div
                    className="flex gap-4 mt-2"
                  >
                    {conn.last_connected && (
                      <div className="flex items-center gap-1">
                        <Clock size={10} className="text-[var(--color-text-muted)]" />
                        <span
                          className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
                        >
                          Last: {formatRelativeTime(conn.last_connected)}
                        </span>
                      </div>
                    )}
                    {conn.channel_filter && (
                      <span
                        className="font-[var(--font-mono)] text-[9px] text-[var(--color-info)]"
                      >
                        CH: {conn.channel_filter}
                      </span>
                    )}
                    {conn.cot_types_filter && conn.cot_types_filter.length > 0 && (
                      <span
                        className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
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
              className="flex items-center gap-1 py-[3px] px-2 bg-transparent border border-[var(--color-border-strong)] rounded-[var(--radius)] text-[var(--color-text-muted)] font-[var(--font-mono)] text-[9px] cursor-pointer"
            >
              <RefreshCw size={10} className={messagesLoading ? 'animate-spin' : ''} />
              REFRESH
            </button>
          }
        >
          {messagesLoading ? (
            <div
              className="flex items-center justify-center gap-2 p-6 text-[var(--color-text-muted)]"
            >
              <Loader size={14} className="animate-spin" />
              <span className="font-[var(--font-mono)] text-[11px]">LOADING...</span>
            </div>
          ) : (
            <MessageFeed messages={messages} />
          )}
        </Card>
      )}
    </div>
  );
}
