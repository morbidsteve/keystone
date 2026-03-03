import { useState, useEffect, useCallback } from 'react';
import {
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
} from 'lucide-react';
import Card from '@/components/ui/Card';
import DataSourceStatusPill from './DataSourceStatusPill';
import DataSourceForm from './DataSourceForm';
import { formatRelativeTime } from '@/lib/utils';
import type { DataSource, DataSourceCreate, ExcelDirectoryConfig } from '@/api/dataSources';
import {
  getDataSources,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  startDataSource,
  stopDataSource,
  testDataSource,
} from '@/api/dataSources';

export default function ExcelWatchPanel() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDataSources({ source_type: 'excel_directory' });
      setSources(data);
    } catch {
      setError('Failed to load Excel watchers');
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
      setShowForm(false);
      await fetchSources();
    } catch {
      setError('Failed to create watcher');
    }
  };

  const handleUpdate = async (data: DataSourceCreate) => {
    if (!editingSource) return;
    try {
      await updateDataSource(editingSource.id, { name: data.name, config: data.config });
      setEditingSource(null);
      await fetchSources();
    } catch {
      setError('Failed to update watcher');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDataSource(id);
      if (selectedSource === id) setSelectedSource(null);
      await fetchSources();
    } catch {
      setError('Failed to delete watcher');
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
      setError('Failed to toggle watcher');
    } finally {
      setTogglingId(null);
    }
  };

  const isActive = (s: DataSource) =>
    s.status === 'active' || s.status === 'connected' || s.status === 'connecting';

  // Edit form
  if (editingSource) {
    return (
      <Card title={`EDIT: ${editingSource.name}`}>
        <DataSourceForm
          initial={editingSource}
          sourceType="excel_directory"
          onSubmit={handleUpdate}
          onCancel={() => setEditingSource(null)}
        />
      </Card>
    );
  }

  // Create form
  if (showForm) {
    return (
      <Card title="NEW EXCEL DIRECTORY WATCHER">
        <DataSourceForm
          sourceType="excel_directory"
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Banners */}
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
          }}
        >
          <AlertTriangle size={14} style={{ color: 'var(--color-danger)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-danger)', flex: 1 }}>
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

      {testResult && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            backgroundColor: testResult.success ? 'rgba(64, 192, 87, 0.1)' : 'rgba(255, 107, 107, 0.1)',
            border: `1px solid ${testResult.success ? 'var(--color-success)' : 'var(--color-danger)'}`,
            borderRadius: 'var(--radius)',
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

      <Card
        title="EXCEL DIRECTORY WATCHERS"
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

        {/* Empty */}
        {!loading && sources.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <FileSpreadsheet size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--color-text)',
                marginBottom: 4,
              }}
            >
              NO EXCEL WATCHERS CONFIGURED
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-muted)',
                marginBottom: 16,
              }}
            >
              Watch directories for Excel files and extract records automatically
            </div>
            <button
              onClick={() => setShowForm(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
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
              <Plus size={14} />
              ADD WATCHER
            </button>
          </div>
        )}

        {/* Source List */}
        {!loading && sources.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sources.map((source) => {
              const isSelected = selectedSource === source.id;
              const config = source.config as ExcelDirectoryConfig;

              return (
                <div
                  key={source.id}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: isSelected ? 'var(--color-bg-hover)' : 'var(--color-bg-surface)',
                    border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
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
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileSpreadsheet size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
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
                        <span>{config.directory_path}</span>
                        <span>{config.file_pattern}</span>
                        {config.template_id != null && (
                          <span style={{ color: 'var(--color-accent)' }}>
                            Template #{config.template_id}
                          </span>
                        )}
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

                  {/* Template note */}
                  {isSelected && config.template_id != null && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 8,
                        padding: '6px 8px',
                        backgroundColor: 'rgba(77, 171, 247, 0.08)',
                        borderRadius: 'var(--radius)',
                      }}
                    >
                      <FileSpreadsheet size={11} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--color-accent)',
                        }}
                      >
                        Using schema mapping template #{config.template_id} for structured data extraction
                      </span>
                    </div>
                  )}

                  {/* Actions */}
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
                        {testingId === source.id ? <Loader size={10} className="animate-spin" /> : <Zap size={10} />}
                        TEST
                      </button>
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

                  {/* Error */}
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
                      <AlertTriangle size={11} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 1 }} />
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

                  {/* Stats */}
                  {isSelected && (
                    <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)' }}>
                        {source.files_processed} files processed
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)' }}>
                        {source.records_ingested.toLocaleString()} records ingested
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)' }}>
                        Poll every {config.poll_interval_seconds}s
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
