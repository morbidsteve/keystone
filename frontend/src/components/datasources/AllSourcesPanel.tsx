import { useState, useEffect, useCallback } from 'react';
import {
  FolderSearch,
  Radio,
  FileSpreadsheet,
  Plus,
  Trash2,
  Play,
  Square,
  Zap,
  Settings,
  AlertTriangle,
  Check,
  X,
  Loader,
  Clock,
  Database,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import DataSourceStatusPill from './DataSourceStatusPill';
import DataSourceForm from './DataSourceForm';
import { formatRelativeTime } from '@/lib/utils';
import type { DataSource, DataSourceType, DataSourceCreate } from '@/api/dataSources';
import {
  getDataSources,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  startDataSource,
  stopDataSource,
  testDataSource,
} from '@/api/dataSources';

const typeIcons: Record<DataSourceType, typeof FolderSearch> = {
  mirc_directory: FolderSearch,
  irc_server: Radio,
  excel_directory: FileSpreadsheet,
};

const typeLabels: Record<DataSourceType, string> = {
  mirc_directory: 'mIRC Directory',
  irc_server: 'IRC Server',
  excel_directory: 'Excel Directory',
};

type AddFlowStep = 'hidden' | 'select-type' | 'form';

export default function AllSourcesPanel() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const [addFlowStep, setAddFlowStep] = useState<AddFlowStep>('hidden');
  const [addSourceType, setAddSourceType] = useState<DataSourceType | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDataSources();
      setSources(data);
    } catch {
      setError('Failed to load data sources');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleCreate = async (data: DataSourceCreate) => {
    try {
      await createDataSource(data);
      setAddFlowStep('hidden');
      setAddSourceType(null);
      await fetchSources();
    } catch {
      setError('Failed to create data source');
    }
  };

  const handleUpdate = async (data: DataSourceCreate) => {
    if (!editingSource) return;
    try {
      await updateDataSource(editingSource.id, { name: data.name, config: data.config });
      setEditingSource(null);
      await fetchSources();
    } catch {
      setError('Failed to update data source');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDataSource(id);
      if (selectedSource === id) setSelectedSource(null);
      await fetchSources();
    } catch {
      setError('Failed to delete data source');
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const result = await testDataSource(id);
      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: 'Test request failed' });
    } finally {
      setTestingId(null);
    }
  };

  const handleToggle = async (source: DataSource) => {
    setTogglingId(source.id);
    try {
      if (source.status === 'active' || source.status === 'connected' || source.status === 'connecting') {
        await stopDataSource(source.id);
      } else {
        await startDataSource(source.id);
      }
      await fetchSources();
    } catch {
      setError('Failed to toggle data source');
    } finally {
      setTogglingId(null);
    }
  };

  // Render edit form
  if (editingSource) {
    return (
      <Card title={`EDIT SOURCE: ${editingSource.name}`}>
        <DataSourceForm
          initial={editingSource}
          sourceType={editingSource.source_type}
          onSubmit={handleUpdate}
          onCancel={() => setEditingSource(null)}
        />
      </Card>
    );
  }

  // Render add form
  if (addFlowStep === 'form' && addSourceType) {
    return (
      <Card title={`NEW ${typeLabels[addSourceType].toUpperCase()} SOURCE`}>
        <DataSourceForm
          sourceType={addSourceType}
          onSubmit={handleCreate}
          onCancel={() => {
            setAddFlowStep('hidden');
            setAddSourceType(null);
          }}
        />
      </Card>
    );
  }

  const isActive = (s: DataSource) =>
    s.status === 'active' || s.status === 'connected' || s.status === 'connecting';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Type selector cards */}
      {addFlowStep === 'select-type' && (
        <Card title="SELECT SOURCE TYPE">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12,
            }}
          >
            {([
              {
                type: 'mirc_directory' as DataSourceType,
                icon: FolderSearch,
                label: 'mIRC Directory Watcher',
                desc: 'Monitor a directory for mIRC chat log files and parse messages for ingestion.',
              },
              {
                type: 'irc_server' as DataSourceType,
                icon: Radio,
                label: 'IRC Server',
                desc: 'Connect to an IRC server and capture messages from specified channels in real time.',
              },
              {
                type: 'excel_directory' as DataSourceType,
                icon: FileSpreadsheet,
                label: 'Excel Directory Watcher',
                desc: 'Watch a directory for Excel spreadsheets and extract records using schema templates.',
              },
            ]).map((opt) => (
              <button
                key={opt.type}
                onClick={() => {
                  setAddSourceType(opt.type);
                  setAddFlowStep('form');
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  padding: '20px 16px',
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                  e.currentTarget.style.borderColor = 'var(--color-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                <opt.icon size={28} style={{ color: 'var(--color-accent)' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--color-text-bright)',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  {opt.label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.4,
                  }}
                >
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              onClick={() => setAddFlowStep('hidden')}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              CANCEL
            </button>
          </div>
        </Card>
      )}

      <Card
        title="ALL INGESTION SOURCES"
        headerRight={
          <button
            onClick={() => setAddFlowStep('select-type')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
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
            <Plus size={13} />
            ADD SOURCE
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
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: testResult.success ? 'var(--color-success)' : 'var(--color-danger)',
                flex: 1,
              }}
            >
              {testResult.message}
            </span>
            <button
              onClick={() => setTestResult(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 2 }}
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
        {!loading && sources.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Database size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--color-text)',
                marginBottom: 4,
              }}
            >
              NO DATA SOURCES CONFIGURED
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-muted)',
                marginBottom: 16,
              }}
            >
              Add an ingestion source to begin automatically importing data
            </div>
            <button
              onClick={() => setAddFlowStep('select-type')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 20px',
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
              <Plus size={14} />
              ADD YOUR FIRST SOURCE
            </button>
          </div>
        )}

        {/* Source List */}
        {!loading && sources.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sources.map((source) => {
              const TypeIcon = typeIcons[source.source_type];
              const isSelected = selectedSource === source.id;

              return (
                <div
                  key={source.id}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: isSelected ? 'var(--color-bg-hover)' : 'var(--color-bg-surface)',
                    border: isSelected
                      ? '1px solid var(--color-accent)'
                      : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    transition: 'all var(--transition)',
                  }}
                  onClick={() => setSelectedSource(isSelected ? null : source.id)}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                  }}
                >
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TypeIcon size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--color-text-bright)',
                        }}
                      >
                        {source.name}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--color-text-muted)',
                          marginTop: 2,
                          display: 'flex',
                          gap: 12,
                        }}
                      >
                        <span>{typeLabels[source.source_type]}</span>
                        <span>{source.files_processed} files</span>
                        <span>{source.records_ingested.toLocaleString()} records</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {source.last_run && (
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          <Clock size={10} />
                          {formatRelativeTime(source.last_run)}
                        </span>
                      )}
                      <DataSourceStatusPill status={source.status} />
                    </div>
                  </div>

                  {/* Actions row (visible when selected) */}
                  {isSelected && (
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
                      {/* Test */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTest(source.id); }}
                        disabled={testingId === source.id}
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
                          opacity: testingId === source.id ? 0.5 : 1,
                        }}
                      >
                        {testingId === source.id ? (
                          <Loader size={10} className="animate-spin" />
                        ) : (
                          <Zap size={10} />
                        )}
                        TEST
                      </button>

                      {/* Start/Stop */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggle(source); }}
                        disabled={togglingId === source.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          backgroundColor: 'transparent',
                          border: `1px solid ${isActive(source) ? 'var(--color-danger)' : 'var(--color-success)'}`,
                          borderRadius: 'var(--radius)',
                          color: isActive(source) ? 'var(--color-danger)' : 'var(--color-success)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          cursor: 'pointer',
                          opacity: togglingId === source.id ? 0.5 : 1,
                        }}
                      >
                        {togglingId === source.id ? (
                          <Loader size={10} className="animate-spin" />
                        ) : isActive(source) ? (
                          <Square size={10} />
                        ) : (
                          <Play size={10} />
                        )}
                        {isActive(source) ? 'STOP' : 'START'}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingSource(source); }}
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
                        onClick={(e) => { e.stopPropagation(); handleDelete(source.id); }}
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
                  {source.last_error && isSelected && (
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
                        style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 1 }}
                      />
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--color-warning)',
                          wordBreak: 'break-word',
                        }}
                      >
                        {source.last_error}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
