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
    <div className="flex flex-col gap-4">
      {/* Banners */}
      {error && (
        <div
          className="flex items-center gap-2 py-2 px-3 bg-[rgba(255,107,107,0.1)] border border-[var(--color-danger)] rounded-[var(--radius)]"
        >
          <AlertTriangle size={14} className="text-[var(--color-danger)]" />
          <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-danger)] flex-1">
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

      {testResult && (
        <div
          className="flex items-center gap-2 py-2 px-3 rounded-[var(--radius)]" style={{ backgroundColor: testResult.success ? 'rgba(64, 192, 87, 0.1)' : 'rgba(255, 107, 107, 0.1)', border: `1px solid ${testResult.success ? 'var(--color-success)' : 'var(--color-danger)'}` }}
        >
          {testResult.success ? (
            <Check size={14} className="text-[var(--color-success)]" />
          ) : (
            <AlertTriangle size={14} className="text-[var(--color-danger)]" />
          )}
          <span
            className="font-[var(--font-mono)] text-[11px] flex-1" style={{ color: testResult.success ? 'var(--color-success)' : 'var(--color-danger)' }}
          >
            {testResult.message}
          </span>
          <button
            onClick={() => setTestResult(null)}
            className="bg-transparent border-0 cursor-pointer text-[var(--color-text-muted)] p-0.5"
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
            className="flex items-center gap-1.5 py-1 px-2.5 bg-[var(--color-accent)] border-0 rounded-[var(--radius)] text-[var(--color-bg)] font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] uppercase cursor-pointer"
          >
            <Plus size={12} />
            ADD
          </button>
        }
      >
        {/* Loading */}
        {loading && (
          <div
            className="flex items-center justify-center gap-2 p-8 text-[var(--color-text-muted)]"
          >
            <Loader size={16} className="animate-spin" />
            <span className="font-[var(--font-mono)] text-[11px]">LOADING...</span>
          </div>
        )}

        {/* Empty */}
        {!loading && sources.length === 0 && (
          <div className="text-center p-8">
            <FileSpreadsheet size={32} className="text-[var(--color-text-muted)] mb-2" />
            <div
              className="font-[var(--font-mono)] text-xs text-[var(--color-text)] mb-1"
            >
              NO EXCEL WATCHERS CONFIGURED
            </div>
            <div
              className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-4"
            >
              Watch directories for Excel files and extract records automatically
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 py-2 px-4 bg-[var(--color-accent)] border-0 rounded-[var(--radius)] text-[var(--color-bg)] font-[var(--font-mono)] text-[11px] font-semibold tracking-[1px] uppercase cursor-pointer"
            >
              <Plus size={14} />
              ADD WATCHER
            </button>
          </div>
        )}

        {/* Source List */}
        {!loading && sources.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {sources.map((source) => {
              const isSelected = selectedSource === source.id;
              const config = source.config as ExcelDirectoryConfig;

              return (
                <div
                  key={source.id}
                  className="py-2.5 px-3 rounded-[var(--radius)] cursor-pointer" style={{ backgroundColor: isSelected ? 'var(--color-bg-hover)' : 'var(--color-bg-surface)', border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)', transition: 'all var(--transition)' }}
                  onClick={() => setSelectedSource(isSelected ? null : source.id)}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet size={14} className="text-[var(--color-accent)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-[var(--font-mono)] text-xs font-semibold text-[var(--color-text-bright)]"
                      >
                        {source.name}
                      </div>
                      <div
                        className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mt-0.5 flex gap-3"
                      >
                        <span>{config.directory_path}</span>
                        <span>{config.file_pattern}</span>
                        {config.template_id != null && (
                          <span className="text-[var(--color-accent)]">
                            Template #{config.template_id}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {source.last_run && (
                        <span
                          className="flex items-center gap-1 font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
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
                      className="flex items-center gap-1.5 mt-2 py-1.5 px-2 bg-[rgba(77,171,247,0.08)] rounded-[var(--radius)]"
                    >
                      <FileSpreadsheet size={11} className="text-[var(--color-accent)] shrink-0" />
                      <span
                        className="font-[var(--font-mono)] text-[10px] text-[var(--color-accent)]"
                      >
                        Using schema mapping template #{config.template_id} for structured data extraction
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  {isSelected && (
                    <div
                      className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-t-[var(--color-border)]"
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTest(source.id); }}
                        disabled={testingId === source.id}
                        className="flex items-center gap-1 py-1 px-2 bg-transparent border border-[var(--color-border-strong)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[10px] cursor-pointer" style={{ opacity: testingId === source.id ? 0.5 : 1 }}
                      >
                        {testingId === source.id ? <Loader size={10} className="animate-spin" /> : <Zap size={10} />}
                        TEST
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggle(source); }}
                        disabled={togglingId === source.id}
                        className="flex items-center gap-1 py-1 px-2 bg-transparent rounded-[var(--radius)] font-[var(--font-mono)] text-[10px] cursor-pointer" style={{ border: `1px solid ${isActive(source) ? 'var(--color-danger)' : 'var(--color-success)'}`, color: isActive(source) ? 'var(--color-danger)' : 'var(--color-success)', opacity: togglingId === source.id ? 0.5 : 1 }}
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
                        className="flex items-center gap-1 py-1 px-2 bg-transparent border border-[var(--color-border-strong)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[10px] cursor-pointer"
                      >
                        <Settings size={10} />
                        EDIT
                      </button>
                      <div className="flex-1" />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(source.id); }}
                        className="flex items-center gap-1 py-1 px-2 bg-transparent border border-[var(--color-danger)] rounded-[var(--radius)] text-[var(--color-danger)] font-[var(--font-mono)] text-[10px] cursor-pointer"
                      >
                        <Trash2 size={10} />
                        DELETE
                      </button>
                    </div>
                  )}

                  {/* Error */}
                  {source.last_error && isSelected && (
                    <div
                      className="flex items-start gap-1.5 mt-2 py-1.5 px-2 bg-[rgba(255,107,107,0.08)] rounded-[var(--radius)]"
                    >
                      <AlertTriangle size={11} className="text-[var(--color-warning)] shrink-0 mt-px" />
                      <span
                        className="font-[var(--font-mono)] text-[10px] text-[var(--color-warning)] break-words"
                      >
                        {source.last_error}
                      </span>
                    </div>
                  )}

                  {/* Stats */}
                  {isSelected && (
                    <div className="flex gap-4 mt-2">
                      <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]">
                        {source.files_processed} files processed
                      </span>
                      <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]">
                        {source.records_ingested.toLocaleString()} records ingested
                      </span>
                      <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]">
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
